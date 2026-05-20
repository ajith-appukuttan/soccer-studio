import express from 'express';
import { z } from 'zod';
import { prisma } from '../services/database';
import { asyncHandler, HttpError } from '../middleware/errorHandler';

const router = express.Router();

// ================================
// VALIDATION SCHEMAS
// ================================

const createProjectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  videoId: z.string().uuid(),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  autoSave: z.boolean().optional(),
  snapToGrid: z.boolean().optional(),
  gridSize: z.number().min(1).max(50).optional(),
});

const addCollaboratorSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['OWNER', 'EDITOR', 'VIEWER']).optional().default('VIEWER'),
});

const annotationSchema = z.object({
  type: z.enum(['CIRCLE', 'RECTANGLE', 'LINE', 'ARROW', 'FREEHAND', 'TEXT', 'PLAYER', 'FORMATION']),
  timestamp: z.number().min(0),
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
  data: z.record(z.any()), // Flexible JSON data for different annotation types
  style: z.record(z.any()).optional(), // Style information
});

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
  timestamp: z.number().min(0),
  parentId: z.string().uuid().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

const querySchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('12'),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ================================
// HELPER FUNCTIONS
// ================================

async function checkProjectAccess(projectId: string, userId: string, organizationId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
    },
    include: {
      collaborators: true,
    },
  });

  if (!project) {
    throw new HttpError(404, 'Project not found');
  }

  const hasAccess = 
    project.ownerId === userId || 
    project.collaborators.some(c => c.userId === userId);

  if (!hasAccess) {
    throw new HttpError(403, 'Access denied to this project');
  }

  return project;
}

async function checkProjectEditAccess(projectId: string, userId: string, organizationId: string) {
  const project = await checkProjectAccess(projectId, userId, organizationId);
  
  const canEdit = 
    project.ownerId === userId || 
    project.collaborators.some(c => c.userId === userId && c.role === 'EDITOR');

  if (!canEdit) {
    throw new HttpError(403, 'Edit access denied for this project');
  }

  return project;
}

// ================================
// PROJECT ROUTES
// ================================

/**
 * GET /api/projects
 * List all projects for the organization
 */
router.get('/', asyncHandler(async (req: any, res) => {
  const query = querySchema.parse(req.query);
  const organizationId = req.organizationId;
  const userId = req.user.id;

  const skip = (query.page - 1) * query.limit;

  // Build where clause for projects user has access to
  const where: any = {
    organizationId,
    OR: [
      { ownerId: userId },
      { collaborators: { some: { userId } } },
    ],
  };

  if (query.search) {
    where.AND = [
      where.OR ? { OR: where.OR } : {},
      {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      },
    ];
    delete where.OR;
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        video: {
          select: {
            id: true,
            title: true,
            duration: true,
            thumbnailUrl: true,
            status: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            annotations: true,
            comments: true,
          },
        },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
    }),
    prisma.project.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      projects,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    },
  });
}));

/**
 * GET /api/projects/:id
 * Get a specific project with all details
 */
router.get('/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const organizationId = req.organizationId;

  await checkProjectAccess(id, userId, organizationId);

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          duration: true,
          width: true,
          height: true,
          streamUrl: true,
          thumbnailUrl: true,
          status: true,
        },
      },
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      annotations: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { timestamp: 'asc' },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        where: { parentId: null }, // Only top-level comments
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  res.json({
    success: true,
    data: project,
  });
}));

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', asyncHandler(async (req: any, res) => {
  const data = createProjectSchema.parse(req.body);
  const userId = req.user.id;
  const organizationId = req.organizationId;

  // Verify video exists and belongs to organization
  const video = await prisma.video.findFirst({
    where: {
      id: data.videoId,
      organizationId,
    },
  });

  if (!video) {
    throw new HttpError(404, 'Video not found');
  }

  const project = await prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      videoId: data.videoId,
      ownerId: userId,
      organizationId,
      autoSave: true,
      snapToGrid: false,
      gridSize: 10,
    },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          duration: true,
          streamUrl: true,
          thumbnailUrl: true,
        },
      },
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: project,
  });
}));

/**
 * PUT /api/projects/:id
 * Update project metadata and settings
 */
router.put('/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const data = updateProjectSchema.parse(req.body);
  const userId = req.user.id;
  const organizationId = req.organizationId;

  await checkProjectEditAccess(id, userId, organizationId);

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.autoSave !== undefined && { autoSave: data.autoSave }),
      ...(data.snapToGrid !== undefined && { snapToGrid: data.snapToGrid }),
      ...(data.gridSize !== undefined && { gridSize: data.gridSize }),
    },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          duration: true,
          streamUrl: true,
          thumbnailUrl: true,
        },
      },
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  res.json({
    success: true,
    data: project,
  });
}));

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const organizationId = req.organizationId;

  const project = await prisma.project.findFirst({
    where: {
      id,
      organizationId,
      ownerId: userId, // Only owner can delete
    },
  });

  if (!project) {
    throw new HttpError(404, 'Project not found or access denied');
  }

  // Delete all related data (annotations, comments, collaborators)
  await prisma.project.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Project deleted successfully',
  });
}));

// ================================
// COLLABORATION ROUTES
// ================================

/**
 * POST /api/projects/:id/collaborators
 * Add a collaborator to the project
 */
router.post('/:id/collaborators', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const data = addCollaboratorSchema.parse(req.body);
  const userId = req.user.id;
  const organizationId = req.organizationId;

  const project = await checkProjectEditAccess(id, userId, organizationId);

  // Verify the user exists and is in the same organization
  const collaborator = await prisma.user.findFirst({
    where: {
      id: data.userId,
      organizationId,
      isActive: true,
    },
  });

  if (!collaborator) {
    throw new HttpError(404, 'User not found in organization');
  }

  // Check if already a collaborator
  const existing = await prisma.projectCollaborator.findFirst({
    where: {
      projectId: id,
      userId: data.userId,
    },
  });

  if (existing) {
    throw new HttpError(400, 'User is already a collaborator');
  }

  const newCollaborator = await prisma.projectCollaborator.create({
    data: {
      projectId: id,
      userId: data.userId,
      role: data.role,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: newCollaborator,
  });
}));

/**
 * DELETE /api/projects/:id/collaborators/:userId
 * Remove a collaborator from the project
 */
router.delete('/:id/collaborators/:userId', asyncHandler(async (req: any, res) => {
  const { id, userId: collaboratorId } = req.params;
  const userId = req.user.id;
  const organizationId = req.organizationId;

  await checkProjectEditAccess(id, userId, organizationId);

  const deleted = await prisma.projectCollaborator.deleteMany({
    where: {
      projectId: id,
      userId: collaboratorId,
    },
  });

  if (deleted.count === 0) {
    throw new HttpError(404, 'Collaborator not found');
  }

  res.json({
    success: true,
    message: 'Collaborator removed successfully',
  });
}));

// ================================
// ANNOTATION ROUTES
// ================================

/**
 * POST /api/projects/:id/annotations
 * Add an annotation to the project
 */
router.post('/:id/annotations', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const data = annotationSchema.parse(req.body);
  const userId = req.user.id;
  const organizationId = req.organizationId;

  await checkProjectEditAccess(id, userId, organizationId);

  const annotation = await prisma.annotation.create({
    data: {
      projectId: id,
      authorId: userId,
      type: data.type,
      timestamp: data.timestamp,
      startTime: data.startTime,
      endTime: data.endTime,
      data: data.data,
      style: data.style || {},
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: annotation,
  });
}));

/**
 * PUT /api/projects/:id/annotations/:annotationId
 * Update an annotation
 */
router.put('/:id/annotations/:annotationId', asyncHandler(async (req: any, res) => {
  const { id, annotationId } = req.params;
  const data = annotationSchema.parse(req.body);
  const userId = req.user.id;
  const organizationId = req.organizationId;

  await checkProjectEditAccess(id, userId, organizationId);

  const annotation = await prisma.annotation.update({
    where: {
      id: annotationId,
      projectId: id,
    },
    data: {
      type: data.type,
      timestamp: data.timestamp,
      startTime: data.startTime,
      endTime: data.endTime,
      data: data.data,
      style: data.style || {},
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: annotation,
  });
}));

/**
 * DELETE /api/projects/:id/annotations/:annotationId
 * Delete an annotation
 */
router.delete('/:id/annotations/:annotationId', asyncHandler(async (req: any, res) => {
  const { id, annotationId } = req.params;
  const userId = req.user.id;
  const organizationId = req.organizationId;

  await checkProjectEditAccess(id, userId, organizationId);

  await prisma.annotation.delete({
    where: {
      id: annotationId,
      projectId: id,
    },
  });

  res.json({
    success: true,
    message: 'Annotation deleted successfully',
  });
}));

// ================================
// COMMENT ROUTES
// ================================

/**
 * POST /api/projects/:id/comments
 * Add a comment to the project
 */
router.post('/:id/comments', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const data = commentSchema.parse(req.body);
  const userId = req.user.id;
  const organizationId = req.organizationId;

  await checkProjectAccess(id, userId, organizationId);

  const comment = await prisma.comment.create({
    data: {
      projectId: id,
      authorId: userId,
      parentId: data.parentId,
      content: data.content,
      timestamp: data.timestamp,
      positionX: data.positionX,
      positionY: data.positionY,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: comment,
  });
}));

/**
 * PUT /api/projects/:id/comments/:commentId
 * Update a comment
 */
router.put('/:id/comments/:commentId', asyncHandler(async (req: any, res) => {
  const { id, commentId } = req.params;
  const { content, resolved } = z.object({
    content: z.string().min(1).max(1000).optional(),
    resolved: z.boolean().optional(),
  }).parse(req.body);
  const userId = req.user.id;
  const organizationId = req.organizationId;

  await checkProjectAccess(id, userId, organizationId);

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      projectId: id,
    },
  });

  if (!comment) {
    throw new HttpError(404, 'Comment not found');
  }

  // Only author can edit content, anyone can resolve
  if (content && comment.authorId !== userId) {
    throw new HttpError(403, 'Only the author can edit comment content');
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      ...(content && { content }),
      ...(resolved !== undefined && { resolved }),
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: updatedComment,
  });
}));

/**
 * DELETE /api/projects/:id/comments/:commentId
 * Delete a comment
 */
router.delete('/:id/comments/:commentId', asyncHandler(async (req: any, res) => {
  const { id, commentId } = req.params;
  const userId = req.user.id;
  const organizationId = req.organizationId;

  await checkProjectAccess(id, userId, organizationId);

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      projectId: id,
      authorId: userId, // Only author can delete
    },
  });

  if (!comment) {
    throw new HttpError(404, 'Comment not found or access denied');
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
}));

export default router;