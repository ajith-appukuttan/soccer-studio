import express from 'express';
import { z } from 'zod';
import { prisma } from '../services/database';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// ================================
// VALIDATION SCHEMAS
// ================================

const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  domain: z.string().min(2).max(50).optional(),
});

const organizationThemeSchema = z.object({
  primary: z.string().regex(/^#[0-9A-F]{6}$/i),
  secondary: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  logo: z.string().url().optional(),
  colors: z.object({
    brand: z.array(z.string().regex(/^#[0-9A-F]{6}$/i)).length(10),
    primary: z.string().regex(/^#[0-9A-F]{6}$/i),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i),
    background: z.string().regex(/^#[0-9A-F]{6}$/i),
    surface: z.string().regex(/^#[0-9A-F]{6}$/i),
    text: z.string().regex(/^#[0-9A-F]{6}$/i),
    textSecondary: z.string().regex(/^#[0-9A-F]{6}$/i),
    border: z.string().regex(/^#[0-9A-F]{6}$/i),
    success: z.string().regex(/^#[0-9A-F]{6}$/i),
    warning: z.string().regex(/^#[0-9A-F]{6}$/i),
    error: z.string().regex(/^#[0-9A-F]{6}$/i),
  }).optional(),
  typography: z.object({
    fontFamily: z.string().optional(),
    sizes: z.object({
      xs: z.number().optional(),
      sm: z.number().optional(),
      md: z.number().optional(),
      lg: z.number().optional(),
      xl: z.number().optional(),
    }).optional(),
  }).optional(),
});

const updateSettingsSchema = z.object({
  maxUsers: z.number().min(1).max(10000).optional(),
  maxStorageGB: z.number().min(1).max(100000).optional(),
  allowVideoUpload: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  theme: organizationThemeSchema.optional(),
});

// ================================
// ROUTES
// ================================

/**
 * GET /api/organization
 * Get current organization details
 */
router.get('/', asyncHandler(async (req: any, res) => {
  const organizationId = req.organizationId;

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      _count: {
        select: {
          users: true,
          videos: true,
          projects: true,
        },
      },
    },
  });

  if (!organization) {
    throw new HttpError(404, 'Organization not found');
  }

  // Calculate storage usage (in GB)
  const storageStats = await prisma.video.aggregate({
    where: { organizationId },
    _sum: { fileSize: true },
  });

  const storageUsedGB = storageStats._sum.fileSize 
    ? Number(storageStats._sum.fileSize) / (1024 ** 3) 
    : 0;

  const organizationWithStats = {
    ...organization,
    stats: {
      users: organization._count.users,
      videos: organization._count.videos,
      projects: organization._count.projects,
      storageUsedGB: Math.round(storageUsedGB * 100) / 100,
      storagePercentage: Math.round((storageUsedGB / organization.maxStorageGB) * 100),
    },
  };

  res.json({
    success: true,
    data: organizationWithStats,
  });
}));

/**
 * PUT /api/organization
 * Update organization details (Admin only)
 */
router.put('/', requireRole(['ADMIN']), asyncHandler(async (req: any, res) => {
  const organizationId = req.organizationId;
  const data = updateOrganizationSchema.parse(req.body);

  // Check if domain is unique (if provided)
  if (data.domain) {
    const existing = await prisma.organization.findFirst({
      where: {
        domain: data.domain,
        id: { not: organizationId },
      },
    });

    if (existing) {
      throw new HttpError(400, 'Domain already in use by another organization');
    }
  }

  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data,
  });

  res.json({
    success: true,
    data: organization,
  });
}));

/**
 * GET /api/organization/members
 * Get organization members
 */
router.get('/members', asyncHandler(async (req: any, res) => {
  const organizationId = req.organizationId;
  const { page = 1, limit = 20, search, role } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where: any = {
    organizationId,
    isActive: true,
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            ownedProjects: true,
            uploadedVideos: true,
            annotations: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // Admins first
        { firstName: 'asc' },
      ],
      skip,
      take: parseInt(limit),
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
}));

/**
 * PUT /api/organization/members/:userId
 * Update member role (Admin only)
 */
router.put('/members/:userId', requireRole(['ADMIN']), asyncHandler(async (req: any, res) => {
  const { userId } = req.params;
  const organizationId = req.organizationId;
  const currentUserId = req.user.id;
  
  const { role } = z.object({
    role: z.enum(['ADMIN', 'COACH', 'ANALYST', 'VIEWER']),
  }).parse(req.body);

  // Don't allow changing own role
  if (userId === currentUserId) {
    throw new HttpError(400, 'Cannot change your own role');
  }

  // Verify user belongs to organization
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId,
    },
  });

  if (!user) {
    throw new HttpError(404, 'User not found in organization');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  res.json({
    success: true,
    data: updatedUser,
  });
}));

/**
 * DELETE /api/organization/members/:userId
 * Remove member from organization (Admin only)
 */
router.delete('/members/:userId', requireRole(['ADMIN']), asyncHandler(async (req: any, res) => {
  const { userId } = req.params;
  const organizationId = req.organizationId;
  const currentUserId = req.user.id;

  // Don't allow removing yourself
  if (userId === currentUserId) {
    throw new HttpError(400, 'Cannot remove yourself from the organization');
  }

  // Verify user belongs to organization
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId,
    },
  });

  if (!user) {
    throw new HttpError(404, 'User not found in organization');
  }

  // Deactivate user instead of deleting
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'User removed from organization',
  });
}));

/**
 * GET /api/organization/settings
 * Get organization settings and theme
 */
router.get('/settings', asyncHandler(async (req: any, res) => {
  const organizationId = req.organizationId;

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      domain: true,
      plan: true,
      maxUsers: true,
      maxStorageGB: true,
      allowVideoUpload: true,
      features: true,
    },
  });

  if (!organization) {
    throw new HttpError(404, 'Organization not found');
  }

  // Default theme configuration
  const defaultTheme = {
    primary: '#22c55e',
    secondary: '#3b82f6',
    colors: {
      brand: [
        '#e6f7f0',
        '#c7edd9',
        '#9ce0b8',
        '#6bd194',
        '#45c477',
        '#2bb866',
        '#20a056',
        '#1b8847',
        '#177038',
        '#10582a',
      ],
      primary: '#22c55e',
      secondary: '#3b82f6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      sizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
      },
    },
  };

  res.json({
    success: true,
    data: {
      ...organization,
      theme: defaultTheme, // In a real implementation, store this in DB
    },
  });
}));

/**
 * PUT /api/organization/settings
 * Update organization settings (Admin only)
 */
router.put('/settings', requireRole(['ADMIN']), asyncHandler(async (req: any, res) => {
  const organizationId = req.organizationId;
  const data = updateSettingsSchema.parse(req.body);

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    throw new HttpError(404, 'Organization not found');
  }

  // Validate storage limits based on plan
  if (data.maxStorageGB) {
    const maxAllowed = organization.plan === 'FREE' ? 10 : 
                      organization.plan === 'PRO' ? 100 : 1000;
    
    if (data.maxStorageGB > maxAllowed) {
      throw new HttpError(400, `Storage limit exceeds plan maximum (${maxAllowed}GB)`);
    }
  }

  // Validate user limits based on plan
  if (data.maxUsers) {
    const maxAllowed = organization.plan === 'FREE' ? 5 : 
                      organization.plan === 'PRO' ? 25 : 100;
    
    if (data.maxUsers > maxAllowed) {
      throw new HttpError(400, `User limit exceeds plan maximum (${maxAllowed})`);
    }
  }

  const updatedOrganization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(data.maxUsers && { maxUsers: data.maxUsers }),
      ...(data.maxStorageGB && { maxStorageGB: data.maxStorageGB }),
      ...(data.allowVideoUpload !== undefined && { allowVideoUpload: data.allowVideoUpload }),
      ...(data.features && { features: data.features }),
    },
  });

  res.json({
    success: true,
    data: updatedOrganization,
  });
}));

/**
 * GET /api/organization/stats
 * Get detailed organization statistics
 */
router.get('/stats', asyncHandler(async (req: any, res) => {
  const organizationId = req.organizationId;

  // Get comprehensive stats
  const [
    userStats,
    videoStats,
    projectStats,
    storageStats,
    recentActivity,
  ] = await Promise.all([
    // User statistics
    prisma.user.groupBy({
      by: ['role'],
      where: { organizationId, isActive: true },
      _count: true,
    }),
    
    // Video statistics
    prisma.video.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
      _sum: { fileSize: true, duration: true },
    }),
    
    // Project statistics
    prisma.project.count({
      where: { organizationId },
    }),
    
    // Storage statistics
    prisma.video.aggregate({
      where: { organizationId },
      _sum: { fileSize: true },
      _count: true,
    }),
    
    // Recent activity (last 30 days)
    prisma.project.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { maxStorageGB: true, maxUsers: true },
  });

  const totalUsers = userStats.reduce((sum, stat) => sum + stat._count, 0);
  const storageUsedGB = storageStats._sum.fileSize 
    ? Number(storageStats._sum.fileSize) / (1024 ** 3) 
    : 0;

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        byRole: userStats.reduce((acc, stat) => {
          acc[stat.role.toLowerCase()] = stat._count;
          return acc;
        }, {} as any),
        limit: organization?.maxUsers || 0,
        percentage: Math.round((totalUsers / (organization?.maxUsers || 1)) * 100),
      },
      videos: {
        total: storageStats._count,
        byStatus: videoStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = stat._count;
          return acc;
        }, {} as any),
        totalDuration: videoStats.reduce((sum, stat) => sum + (stat._sum.duration || 0), 0),
      },
      projects: {
        total: projectStats,
        recentlyCreated: recentActivity,
      },
      storage: {
        usedGB: Math.round(storageUsedGB * 100) / 100,
        limitGB: organization?.maxStorageGB || 0,
        percentage: Math.round((storageUsedGB / (organization?.maxStorageGB || 1)) * 100),
      },
    },
  });
}));

export default router;