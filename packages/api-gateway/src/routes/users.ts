import express from 'express';
import { z } from 'zod';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';
import { prisma } from '../services/database';
import type { User, ApiResponse } from '@shared/types';

const router = express.Router();



const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  role: z.enum(['admin', 'coach', 'analyst', 'viewer']).optional(),
});

// GET /api/users
router.get('/', requireRole(['admin', 'coach']), asyncHandler(async (req: any, res) => {
  const users = await prisma.user.findMany({
    where: {
      organizationId: req.organizationId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      organizationId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  const response: ApiResponse<User[]> = {
    success: true,
    data: users,
  };
  
  res.json(response);
}));

// GET /api/users/:id
router.get('/:id', asyncHandler(async (req: any, res) => {
  const user = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      organizationId: req.organizationId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      organizationId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  if (!user) {
    throw new HttpError('User not found', 404);
  }
  
  // Users can view their own profile, admins can view any profile
  if (user.id !== req.user.id && req.user.role !== 'ADMIN') {
    throw new HttpError('Insufficient permissions', 403);
  }
  
  const response: ApiResponse<User> = {
    success: true,
    data: user,
  };
  
  res.json(response);
}));

// PUT /api/users/:id
router.put('/:id', asyncHandler(async (req: any, res) => {
  const user = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      organizationId: req.organizationId,
    },
  });
  
  if (!user) {
    throw new HttpError('User not found', 404);
  }
  
  // Users can update their own profile, admins can update any profile
  if (user.id !== req.user.id && req.user.role !== 'ADMIN') {
    throw new HttpError('Insufficient permissions', 403);
  }
  
  const updates = updateUserSchema.parse(req.body);
  
  // Only admins can change roles
  if (updates.role && req.user.role !== 'ADMIN') {
    throw new HttpError('Only administrators can change user roles', 403);
  }
  
  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      organizationId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  const response: ApiResponse<User> = {
    success: true,
    data: updatedUser,
  };
  
  res.json(response);
}));

// DELETE /api/users/:id
router.delete('/:id', requireRole(['ADMIN']), asyncHandler(async (req: any, res) => {
  const user = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      organizationId: req.organizationId,
    },
  });
  
  if (!user) {
    throw new HttpError('User not found', 404);
  }
  
  // Prevent self-deletion
  if (user.id === req.user.id) {
    throw new HttpError('Cannot delete your own account', 400);
  }
  
  await prisma.user.delete({
    where: { id: req.params.id },
  });
  
  const response: ApiResponse<void> = {
    success: true,
    message: 'User deleted successfully',
  };
  
  res.json(response);
}));

export default router;