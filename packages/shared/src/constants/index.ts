// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  VIDEOS: {
    LIST: '/videos',
    UPLOAD: '/videos/upload',
    GET: (id: string) => `/videos/${id}`,
    DELETE: (id: string) => `/videos/${id}`,
    STREAM: (id: string) => `/videos/${id}/stream`,
    THUMBNAIL: (id: string) => `/videos/${id}/thumbnail`,
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: (id: string) => `/projects/${id}`,
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
    ANNOTATIONS: (id: string) => `/projects/${id}/annotations`,
    COMMENTS: (id: string) => `/projects/${id}/comments`,
  },
  USERS: {
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
  },
  ORGANIZATIONS: {
    GET: '/organization',
    UPDATE: '/organization',
    MEMBERS: '/organization/members',
    SETTINGS: '/organization/settings',
  },
} as const;

// Drawing Tools
export const DRAWING_TOOLS = {
  SELECT: 'select',
  CIRCLE: 'circle',
  RECTANGLE: 'rectangle',
  LINE: 'line',
  ARROW: 'arrow',
  FREEHAND: 'freehand',
  TEXT: 'text',
  PLAYER: 'player',
  FORMATION: 'formation',
} as const;

// Default Colors
export const DEFAULT_COLORS = {
  HOME_TEAM: { r: 0, g: 123, b: 255, a: 1 }, // Blue
  AWAY_TEAM: { r: 255, g: 59, b: 48, a: 1 }, // Red
  NEUTRAL: { r: 108, g: 117, b: 125, a: 1 }, // Gray
  SUCCESS: { r: 40, g: 167, b: 69, a: 1 }, // Green
  WARNING: { r: 255, g: 193, b: 7, a: 1 }, // Yellow
  ERROR: { r: 220, g: 53, b: 69, a: 1 }, // Red
  WHITE: { r: 255, g: 255, b: 255, a: 1 },
  BLACK: { r: 0, g: 0, b: 0, a: 1 },
} as const;

// Soccer Field Dimensions (relative to video)
export const FIELD_DIMENSIONS = {
  LENGTH: 105, // meters
  WIDTH: 68, // meters
  GOAL_WIDTH: 7.32, // meters
  GOAL_HEIGHT: 2.44, // meters
  PENALTY_AREA_LENGTH: 16.5, // meters
  PENALTY_AREA_WIDTH: 40.3, // meters
  CENTER_CIRCLE_RADIUS: 9.15, // meters
} as const;

// Video Processing
export const VIDEO_SETTINGS = {
  SUPPORTED_FORMATS: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  THUMBNAIL_INTERVAL: 10, // seconds
  PREVIEW_QUALITY: {
    width: 640,
    height: 360,
  },
  EXPORT_QUALITIES: {
    LOW: { width: 480, height: 270, bitrate: '500k' },
    MEDIUM: { width: 720, height: 405, bitrate: '1000k' },
    HIGH: { width: 1080, height: 607, bitrate: '2000k' },
    ORIGINAL: null,
  },
} as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: 'Space',
  STEP_FORWARD: 'ArrowRight',
  STEP_BACKWARD: 'ArrowLeft',
  JUMP_FORWARD: 'ArrowRight+Shift',
  JUMP_BACKWARD: 'ArrowLeft+Shift',
  ZOOM_IN: 'Equal',
  ZOOM_OUT: 'Minus',
  RESET_ZOOM: 'Digit0',
  SAVE: 'KeyS+Ctrl',
  UNDO: 'KeyZ+Ctrl',
  REDO: 'KeyY+Ctrl',
  DELETE: 'Delete',
  SELECT_TOOL: 'KeyV',
  CIRCLE_TOOL: 'KeyC',
  LINE_TOOL: 'KeyL',
  ARROW_TOOL: 'KeyA',
  TEXT_TOOL: 'KeyT',
} as const;

// User Roles and Permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
} as const;

export const PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'create_project',
    'edit_project',
    'delete_project',
    'upload_video',
    'manage_users',
    'manage_organization',
    'export_video',
    'add_comments',
    'add_annotations',
  ],
  [USER_ROLES.COACH]: [
    'create_project',
    'edit_project',
    'upload_video',
    'export_video',
    'add_comments',
    'add_annotations',
  ],
  [USER_ROLES.ANALYST]: [
    'create_project',
    'edit_project',
    'add_comments',
    'add_annotations',
  ],
  [USER_ROLES.VIEWER]: [
    'view_project',
    'add_comments',
  ],
} as const;

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    maxUsers: 3,
    maxStorage: 1, // GB
    maxProjects: 5,
    features: ['basic_editing', 'comments'],
  },
  PRO: {
    name: 'Pro',
    maxUsers: 25,
    maxStorage: 50, // GB
    maxProjects: 100,
    features: ['basic_editing', 'comments', 'advanced_tools', 'exports'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxUsers: -1, // unlimited
    maxStorage: 500, // GB
    maxProjects: -1, // unlimited
    features: [
      'basic_editing',
      'comments',
      'advanced_tools',
      'exports',
      'ai_analysis',
      'custom_branding',
      'sso',
      'priority_support',
    ],
  },
} as const;

// WebSocket Events
export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Project collaboration
  JOIN_PROJECT: 'join_project',
  LEAVE_PROJECT: 'leave_project',
  
  // Real-time editing
  ANNOTATION_ADDED: 'annotation_added',
  ANNOTATION_UPDATED: 'annotation_updated',
  ANNOTATION_DELETED: 'annotation_deleted',
  
  // Comments
  COMMENT_ADDED: 'comment_added',
  COMMENT_UPDATED: 'comment_updated',
  COMMENT_DELETED: 'comment_deleted',
  
  // User activity
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  CURSOR_MOVED: 'cursor_moved',
} as const;