import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './database';

export interface CollaborationUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  color: string;
  cursor?: { x: number; y: number };
  lastSeen: Date;
}

export interface ProjectRoom {
  projectId: string;
  users: Map<string, CollaborationUser>;
  annotations: Map<string, any>;
  lastActivity: Date;
}

export class CollaborationService {
  private io: SocketIOServer;
  private rooms: Map<string, ProjectRoom> = new Map();
  private userColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  private colorIndex = 0;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
    
    // Cleanup inactive rooms every 5 minutes
    setInterval(() => {
      this.cleanupInactiveRooms();
    }, 5 * 60 * 1000);
  }

  private setupSocketHandlers(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('No token provided');
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Fetch user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { organization: true },
        });

        if (!user || !user.isActive) {
          throw new Error('User not found or inactive');
        }

        // Attach user to socket
        socket.data.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`👥 User connected: ${socket.data.user.firstName} ${socket.data.user.lastName} (${socket.id})`);

      // Handle joining a project room
      socket.on('join_project', async (data: { projectId: string }) => {
        try {
          await this.handleJoinProject(socket, data.projectId);
        } catch (error) {
          console.error('Error joining project:', error);
          socket.emit('error', { message: 'Failed to join project' });
        }
      });

      // Handle leaving a project room
      socket.on('leave_project', (data: { projectId: string }) => {
        this.handleLeaveProject(socket, data.projectId);
      });

      // Handle cursor movement
      socket.on('cursor_moved', (data: { projectId: string; position: { x: number; y: number } }) => {
        this.handleCursorMoved(socket, data);
      });

      // Handle annotation events
      socket.on('annotation_added', (data: { projectId: string; annotation: any }) => {
        this.handleAnnotationAdded(socket, data);
      });

      socket.on('annotation_updated', (data: { projectId: string; annotationId: string; annotation: any }) => {
        this.handleAnnotationUpdated(socket, data);
      });

      socket.on('annotation_deleted', (data: { projectId: string; annotationId: string }) => {
        this.handleAnnotationDeleted(socket, data);
      });

      // Handle comment events
      socket.on('comment_added', (data: { projectId: string; comment: any }) => {
        this.handleCommentAdded(socket, data);
      });

      // Handle video sync events
      socket.on('video_seek', (data: { projectId: string; timestamp: number }) => {
        this.handleVideoSeek(socket, data);
      });

      socket.on('video_play', (data: { projectId: string; timestamp: number }) => {
        this.handleVideoPlay(socket, data);
      });

      socket.on('video_pause', (data: { projectId: string; timestamp: number }) => {
        this.handleVideoPause(socket, data);
      });

      // Handle selection events
      socket.on('selection_changed', (data: { projectId: string; selectedAnnotations: string[] }) => {
        this.handleSelectionChanged(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinProject(socket: any, projectId: string): Promise<void> {
    const user = socket.data.user;

    // Verify user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user.organizationId,
        OR: [
          { ownerId: user.id },
          { collaborators: { some: { userId: user.id } } },
        ],
      },
      include: {
        annotations: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Join socket room
    socket.join(`project:${projectId}`);

    // Get or create room data
    let room = this.rooms.get(projectId);
    if (!room) {
      room = {
        projectId,
        users: new Map(),
        annotations: new Map(),
        lastActivity: new Date(),
      };
      this.rooms.set(projectId, room);
    }

    // Add user to room with assigned color
    const collaborationUser: CollaborationUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      color: this.getUserColor(user.id),
      lastSeen: new Date(),
    };

    room.users.set(socket.id, collaborationUser);

    // Notify other users
    socket.to(`project:${projectId}`).emit('user_joined', {
      user: collaborationUser,
      socketId: socket.id,
    });

    // Send current room state to the joining user
    socket.emit('project_joined', {
      project: {
        id: project.id,
        title: project.title,
        annotations: project.annotations,
        comments: project.comments,
      },
      collaborators: Array.from(room.users.values()),
      roomId: `project:${projectId}`,
    });

    console.log(`👥 ${user.firstName} joined project ${project.title}`);
  }

  private handleLeaveProject(socket: any, projectId: string): void {
    socket.leave(`project:${projectId}`);

    const room = this.rooms.get(projectId);
    if (room) {
      const user = room.users.get(socket.id);
      room.users.delete(socket.id);

      // Notify other users
      socket.to(`project:${projectId}`).emit('user_left', {
        user,
        socketId: socket.id,
      });

      // Remove room if empty
      if (room.users.size === 0) {
        this.rooms.delete(projectId);
      }

      console.log(`👥 User left project ${projectId}`);
    }
  }

  private handleCursorMoved(socket: any, data: { projectId: string; position: { x: number; y: number } }): void {
    const room = this.rooms.get(data.projectId);
    if (room && room.users.has(socket.id)) {
      const user = room.users.get(socket.id)!;
      user.cursor = data.position;
      user.lastSeen = new Date();

      // Broadcast cursor position to other users
      socket.to(`project:${data.projectId}`).emit('cursor_moved', {
        userId: user.id,
        socketId: socket.id,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          color: user.color,
        },
        position: data.position,
      });
    }
  }

  private async handleAnnotationAdded(socket: any, data: { projectId: string; annotation: any }): Promise<void> {
    try {
      // Save annotation to database
      const annotation = await prisma.annotation.create({
        data: {
          projectId: data.projectId,
          authorId: socket.data.user.id,
          type: data.annotation.type,
          timestamp: data.annotation.timestamp,
          startTime: data.annotation.startTime,
          endTime: data.annotation.endTime,
          data: data.annotation.data,
          style: data.annotation.style,
        },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Update room cache
      const room = this.rooms.get(data.projectId);
      if (room) {
        room.annotations.set(annotation.id, annotation);
        room.lastActivity = new Date();
      }

      // Broadcast to all users in the project
      this.io.to(`project:${data.projectId}`).emit('annotation_added', {
        annotation,
        author: {
          id: socket.data.user.id,
          firstName: socket.data.user.firstName,
          lastName: socket.data.user.lastName,
        },
      });

      console.log(`📝 Annotation added by ${socket.data.user.firstName} in project ${data.projectId}`);
    } catch (error) {
      console.error('Error adding annotation:', error);
      socket.emit('error', { message: 'Failed to add annotation' });
    }
  }

  private async handleAnnotationUpdated(socket: any, data: { projectId: string; annotationId: string; annotation: any }): Promise<void> {
    try {
      // Update annotation in database
      const annotation = await prisma.annotation.update({
        where: { id: data.annotationId },
        data: {
          type: data.annotation.type,
          timestamp: data.annotation.timestamp,
          startTime: data.annotation.startTime,
          endTime: data.annotation.endTime,
          data: data.annotation.data,
          style: data.annotation.style,
        },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Update room cache
      const room = this.rooms.get(data.projectId);
      if (room) {
        room.annotations.set(annotation.id, annotation);
        room.lastActivity = new Date();
      }

      // Broadcast to all users except sender
      socket.to(`project:${data.projectId}`).emit('annotation_updated', {
        annotation,
        updatedBy: {
          id: socket.data.user.id,
          firstName: socket.data.user.firstName,
          lastName: socket.data.user.lastName,
        },
      });
    } catch (error) {
      console.error('Error updating annotation:', error);
      socket.emit('error', { message: 'Failed to update annotation' });
    }
  }

  private async handleAnnotationDeleted(socket: any, data: { projectId: string; annotationId: string }): Promise<void> {
    try {
      // Delete annotation from database
      await prisma.annotation.delete({
        where: { id: data.annotationId },
      });

      // Remove from room cache
      const room = this.rooms.get(data.projectId);
      if (room) {
        room.annotations.delete(data.annotationId);
        room.lastActivity = new Date();
      }

      // Broadcast to all users
      this.io.to(`project:${data.projectId}`).emit('annotation_deleted', {
        annotationId: data.annotationId,
        deletedBy: {
          id: socket.data.user.id,
          firstName: socket.data.user.firstName,
          lastName: socket.data.user.lastName,
        },
      });
    } catch (error) {
      console.error('Error deleting annotation:', error);
      socket.emit('error', { message: 'Failed to delete annotation' });
    }
  }

  private async handleCommentAdded(socket: any, data: { projectId: string; comment: any }): Promise<void> {
    try {
      // Save comment to database
      const comment = await prisma.comment.create({
        data: {
          projectId: data.projectId,
          authorId: socket.data.user.id,
          parentId: data.comment.parentId,
          content: data.comment.content,
          timestamp: data.comment.timestamp,
          positionX: data.comment.positionX,
          positionY: data.comment.positionY,
        },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Broadcast to all users in the project
      this.io.to(`project:${data.projectId}`).emit('comment_added', { comment });

      console.log(`💬 Comment added by ${socket.data.user.firstName} in project ${data.projectId}`);
    } catch (error) {
      console.error('Error adding comment:', error);
      socket.emit('error', { message: 'Failed to add comment' });
    }
  }

  private handleVideoSeek(socket: any, data: { projectId: string; timestamp: number }): void {
    socket.to(`project:${data.projectId}`).emit('video_seek', {
      timestamp: data.timestamp,
      user: {
        id: socket.data.user.id,
        firstName: socket.data.user.firstName,
        lastName: socket.data.user.lastName,
      },
    });
  }

  private handleVideoPlay(socket: any, data: { projectId: string; timestamp: number }): void {
    socket.to(`project:${data.projectId}`).emit('video_play', {
      timestamp: data.timestamp,
      user: {
        id: socket.data.user.id,
        firstName: socket.data.user.firstName,
        lastName: socket.data.user.lastName,
      },
    });
  }

  private handleVideoPause(socket: any, data: { projectId: string; timestamp: number }): void {
    socket.to(`project:${data.projectId}`).emit('video_pause', {
      timestamp: data.timestamp,
      user: {
        id: socket.data.user.id,
        firstName: socket.data.user.firstName,
        lastName: socket.data.user.lastName,
      },
    });
  }

  private handleSelectionChanged(socket: any, data: { projectId: string; selectedAnnotations: string[] }): void {
    socket.to(`project:${data.projectId}`).emit('selection_changed', {
      selectedAnnotations: data.selectedAnnotations,
      user: {
        id: socket.data.user.id,
        firstName: socket.data.user.firstName,
        lastName: socket.data.user.lastName,
        color: this.getUserColor(socket.data.user.id),
      },
    });
  }

  private handleDisconnect(socket: any): void {
    // Remove user from all project rooms
    for (const [projectId, room] of this.rooms.entries()) {
      if (room.users.has(socket.id)) {
        const user = room.users.get(socket.id);
        room.users.delete(socket.id);

        // Notify other users
        socket.to(`project:${projectId}`).emit('user_left', {
          user,
          socketId: socket.id,
        });

        // Remove room if empty
        if (room.users.size === 0) {
          this.rooms.delete(projectId);
        }
      }
    }

    console.log(`👥 User disconnected: ${socket.id}`);
  }

  private getUserColor(userId: string): string {
    // Generate consistent color for user
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return this.userColors[Math.abs(hash) % this.userColors.length];
  }

  private cleanupInactiveRooms(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    for (const [projectId, room] of this.rooms.entries()) {
      if (room.lastActivity < fiveMinutesAgo && room.users.size === 0) {
        this.rooms.delete(projectId);
        console.log(`🧹 Cleaned up inactive room: ${projectId}`);
      }
    }
  }

  // Public methods for getting room stats
  public getRoomStats(): {
    totalRooms: number;
    totalUsers: number;
    rooms: Array<{ projectId: string; userCount: number; lastActivity: Date }>;
  } {
    const rooms = Array.from(this.rooms.entries()).map(([projectId, room]) => ({
      projectId,
      userCount: room.users.size,
      lastActivity: room.lastActivity,
    }));

    return {
      totalRooms: this.rooms.size,
      totalUsers: rooms.reduce((sum, room) => sum + room.userCount, 0),
      rooms,
    };
  }
}