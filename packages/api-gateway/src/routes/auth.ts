import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../services/database';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// ================================
// VALIDATION SCHEMAS
// ================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  organizationName: z.string().min(2).optional(),
});

// ================================
// UTILITY FUNCTIONS
// ================================

const generateToken = (userId: string, organizationId: string): string => {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
  return jwt.sign(
    { userId, organizationId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
};

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// ================================
// ROUTES
// ================================

/**
 * POST /api/auth/login
 * User login with email and password
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  // Find user with organization
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user || !user.isActive) {
    throw new HttpError(401, 'Invalid email or password');
  }

  if (!user.organization?.isActive) {
    throw new HttpError(401, 'Organization is inactive');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new HttpError(401, 'Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate JWT token
  const token = generateToken(user.id, user.organizationId);

  // Return user data (without password hash)
  const { passwordHash, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      organization: user.organization,
      token,
    },
  });
}));

/**
 * POST /api/auth/register
 * User registration with organization creation
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, organizationName } = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new HttpError(400, 'User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create organization if provided, otherwise use default
  const organization = await prisma.organization.create({
    data: {
      name: organizationName || `${firstName} ${lastName}'s Organization`,
      domain: organizationName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'default',
      plan: 'FREE',
      maxUsers: 5,
      maxStorageGB: 10,
      features: ['basic_editing', 'comments'],
    },
  });

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      passwordHash,
      role: 'ADMIN', // First user in organization is admin
      organizationId: organization.id,
    },
    include: { organization: true },
  });

  // Generate JWT token
  const token = generateToken(user.id, user.organizationId);

  // Return user data (without password hash)
  const { passwordHash: _, ...userWithoutPassword } = user;

  res.status(201).json({
    success: true,
    data: {
      user: userWithoutPassword,
      organization: user.organization,
      token,
    },
  });
}));

/**
 * POST /api/auth/logout
 * User logout (client-side token removal)
 */
router.post('/logout', asyncHandler(async (req, res) => {
  // In a more advanced implementation, you might want to:
  // - Blacklist the token
  // - Clear refresh tokens
  // - Log the logout event

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}));

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Return user data (without password hash)
  const { passwordHash, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      organization: user.organization,
    },
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const organizationId = (req as any).organizationId;

  // Generate new token
  const token = generateToken(userId, organizationId);

  res.json({
    success: true,
    data: { token },
  });
}));

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authMiddleware, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }).parse(req.body);

  const userId = (req as any).user.id;

  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Verify current password
  const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValidPassword) {
    throw new HttpError(400, 'Current password is incorrect');
  }

  // Hash new password and update
  const newPasswordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  res.json({
    success: true,
    message: 'Password updated successfully',
  });
}));

/**
 * POST /api/auth/forgot-password
 * Initiate password reset (placeholder for email integration)
 */
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = z.object({
    email: z.string().email(),
  }).parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Don't reveal if user exists for security
  res.json({
    success: true,
    message: 'If an account with that email exists, you will receive a password reset link.',
  });

  // TODO: In production, implement:
  // 1. Generate reset token
  // 2. Store reset token in database with expiry
  // 3. Send email with reset link
}));




export default router;