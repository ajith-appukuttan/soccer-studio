import { z } from 'zod';

// User Types
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['admin', 'coach', 'analyst', 'viewer']),
  organizationId: z.string().uuid(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// Organization Types
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  domain: z.string().optional(),
  plan: z.enum(['free', 'pro', 'enterprise']),
  settings: z.object({
    allowVideoUpload: z.boolean().default(true),
    maxStorageGB: z.number(),
    maxUsers: z.number(),
    features: z.array(z.string()),
  }),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

// Video Types
export const VideoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  filename: z.string(),
  fileSize: z.number(),
  duration: z.number(), // seconds
  resolution: z.object({
    width: z.number(),
    height: z.number(),
  }),
  fps: z.number(),
  format: z.string(),
  uploaderId: z.string().uuid(),
  organizationId: z.string().uuid(),
  status: z.enum(['uploading', 'processing', 'ready', 'error']),
  thumbnailUrl: z.string().url().optional(),
  streamUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Video = z.infer<typeof VideoSchema>;

// Annotation Types
export const Vector2Schema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Vector2 = z.infer<typeof Vector2Schema>;

export const ColorSchema = z.object({
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
  a: z.number().min(0).max(1).default(1),
});

export type Color = z.infer<typeof ColorSchema>;

export const DrawingToolSchema = z.enum([
  'select',
  'circle',
  'rectangle',
  'line',
  'arrow',
  'freehand',
  'text',
  'player',
  'formation',
]);

export type DrawingTool = z.infer<typeof DrawingToolSchema>;

export const BaseAnnotationSchema = z.object({
  id: z.string().uuid(),
  type: DrawingToolSchema,
  timestamp: z.number(), // seconds in video
  startTime: z.number().optional(), // for duration annotations
  endTime: z.number().optional(),
  authorId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CircleAnnotationSchema = BaseAnnotationSchema.extend({
  type: z.literal('circle'),
  center: Vector2Schema,
  radius: z.number(),
  style: z.object({
    strokeColor: ColorSchema,
    fillColor: ColorSchema.optional(),
    strokeWidth: z.number().default(2),
    filled: z.boolean().default(false),
  }),
});

export const LineAnnotationSchema = BaseAnnotationSchema.extend({
  type: z.literal('line'),
  points: z.array(Vector2Schema).min(2),
  style: z.object({
    strokeColor: ColorSchema,
    strokeWidth: z.number().default(2),
    lineDash: z.array(z.number()).optional(),
  }),
});

export const ArrowAnnotationSchema = BaseAnnotationSchema.extend({
  type: z.literal('arrow'),
  start: Vector2Schema,
  end: Vector2Schema,
  style: z.object({
    strokeColor: ColorSchema,
    strokeWidth: z.number().default(2),
    arrowSize: z.number().default(10),
  }),
});

export const TextAnnotationSchema = BaseAnnotationSchema.extend({
  type: z.literal('text'),
  position: Vector2Schema,
  content: z.string(),
  style: z.object({
    fontSize: z.number().default(16),
    fontFamily: z.string().default('Arial'),
    color: ColorSchema,
    backgroundColor: ColorSchema.optional(),
    bold: z.boolean().default(false),
    italic: z.boolean().default(false),
  }),
});

export const PlayerAnnotationSchema = BaseAnnotationSchema.extend({
  type: z.literal('player'),
  position: Vector2Schema,
  playerNumber: z.string(),
  team: z.enum(['home', 'away']),
  style: z.object({
    color: ColorSchema,
    size: z.number().default(20),
  }),
});

export const FormationAnnotationSchema = BaseAnnotationSchema.extend({
  type: z.literal('formation'),
  players: z.array(z.object({
    position: Vector2Schema,
    number: z.string(),
    team: z.enum(['home', 'away']),
  })),
  formation: z.string(), // e.g., "4-4-2"
  style: z.object({
    homeColor: ColorSchema,
    awayColor: ColorSchema,
    lineColor: ColorSchema,
    showLines: z.boolean().default(true),
  }),
});

export const AnnotationSchema = z.discriminatedUnion('type', [
  CircleAnnotationSchema,
  LineAnnotationSchema,
  ArrowAnnotationSchema,
  TextAnnotationSchema,
  PlayerAnnotationSchema,
  FormationAnnotationSchema,
]);

export type Annotation = z.infer<typeof AnnotationSchema>;

// Comment Types
export const CommentSchema = z.object({
  id: z.string().uuid(),
  videoId: z.string().uuid(),
  timestamp: z.number(),
  content: z.string(),
  authorId: z.string().uuid(),
  parentId: z.string().uuid().optional(), // for replies
  position: Vector2Schema.optional(), // screen position
  resolved: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Comment = z.infer<typeof CommentSchema>;

// Project Types
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  videoId: z.string().uuid(),
  organizationId: z.string().uuid(),
  ownerId: z.string().uuid(),
  collaborators: z.array(z.string().uuid()),
  annotations: z.array(AnnotationSchema),
  settings: z.object({
    autoSave: z.boolean().default(true),
    snapToGrid: z.boolean().default(false),
    gridSize: z.number().default(10),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Project = z.infer<typeof ProjectSchema>;

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Theme Types
export const ThemeSchema = z.object({
  name: z.string(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    background: z.string(),
    surface: z.string(),
    text: z.string(),
    textSecondary: z.string(),
    border: z.string(),
    success: z.string(),
    warning: z.string(),
    error: z.string(),
  }),
  spacing: z.object({
    xs: z.number(),
    sm: z.number(),
    md: z.number(),
    lg: z.number(),
    xl: z.number(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    sizes: z.object({
      xs: z.number(),
      sm: z.number(),
      md: z.number(),
      lg: z.number(),
      xl: z.number(),
    }),
  }),
});

export type Theme = z.infer<typeof ThemeSchema>;