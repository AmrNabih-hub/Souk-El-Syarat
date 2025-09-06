import { WebSocketGateway as WSGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RealtimeService } from './realtime.service';
import { EventService } from './event.service';
import { NotificationService } from './notification.service';

@WSGateway({
  cors: {
    origin: ['http://localhost:3000', 'https://soukel-syarat.com'],
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeWebSocketGateway.name);
  private readonly connectedClients = new Map<string, {
    socket: Socket;
    userId?: string;
    userRole?: string;
    rooms: Set<string>;
    lastActivity: Date;
  }>();

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly eventService: EventService,
    private readonly notificationService: NotificationService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);
      
      // Initialize client data
      this.connectedClients.set(client.id, {
        socket: client,
        rooms: new Set(),
        lastActivity: new Date(),
      });

      // Send welcome message
      client.emit('connected', {
        message: 'Connected to real-time service',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });

      // Start heartbeat
      this.startHeartbeat(client);

    } catch (error) {
      this.logger.error(`Error handling connection for ${client.id}:`, error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      this.logger.log(`Client disconnected: ${client.id}`);
      
      const clientData = this.connectedClients.get(client.id);
      if (clientData) {
        // Leave all rooms
        for (const room of clientData.rooms) {
          await this.handleLeaveRoom(client, { room });
        }
        
        // Clean up
        this.connectedClients.delete(client.id);
      }

    } catch (error) {
      this.logger.error(`Error handling disconnection for ${client.id}:`, error);
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string; userId: string; userRole: string }
  ) {
    try {
      // In a real implementation, you would validate the JWT token
      const clientData = this.connectedClients.get(client.id);
      if (clientData) {
        clientData.userId = data.userId;
        clientData.userRole = data.userRole;
        
        // Join user-specific room
        await this.handleJoinRoom(client, { room: `user:${data.userId}` });
        
        // Join role-specific room
        await this.handleJoinRoom(client, { room: `role:${data.userRole}` });
      }

      client.emit('authenticated', {
        message: 'Authentication successful',
        userId: data.userId,
        userRole: data.userRole,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Authentication error for ${client.id}:`, error);
      client.emit('error', {
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string }
  ) {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        client.emit('error', { message: 'Client not found' });
        return;
      }

      // Check permissions
      if (!this.canJoinRoom(clientData, data.room)) {
        client.emit('error', { message: 'Insufficient permissions to join room' });
        return;
      }

      await client.join(data.room);
      clientData.rooms.add(data.room);
      clientData.lastActivity = new Date();

      client.emit('room_joined', {
        room: data.room,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(`Client ${client.id} joined room: ${data.room}`);

    } catch (error) {
      this.logger.error(`Error joining room for ${client.id}:`, error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string }
  ) {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        client.emit('error', { message: 'Client not found' });
        return;
      }

      await client.leave(data.room);
      clientData.rooms.delete(data.room);
      clientData.lastActivity = new Date();

      client.emit('room_left', {
        room: data.room,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(`Client ${client.id} left room: ${data.room}`);

    } catch (error) {
      this.logger.error(`Error leaving room for ${client.id}:`, error);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; message: string; type?: string }
  ) {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        client.emit('error', { message: 'Client not found' });
        return;
      }

      // Check if client is in the room
      if (!clientData.rooms.has(data.room)) {
        client.emit('error', { message: 'Not in room' });
        return;
      }

      const messageData = {
        id: this.generateMessageId(),
        room: data.room,
        message: data.message,
        type: data.type || 'text',
        senderId: clientData.userId,
        senderRole: clientData.userRole,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to room
      this.server.to(data.room).emit('message', messageData);

      // Store message
      await this.eventService.storeMessage(messageData);

      this.logger.debug(`Message sent to room ${data.room} by ${client.id}`);

    } catch (error) {
      this.logger.error(`Error sending message for ${client.id}:`, error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('get_online_users')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    try {
      const onlineUsers = Array.from(this.connectedClients.values())
        .filter(clientData => clientData.userId)
        .map(clientData => ({
          userId: clientData.userId,
          userRole: clientData.userRole,
          lastActivity: clientData.lastActivity,
        }));

      client.emit('online_users', {
        users: onlineUsers,
        count: onlineUsers.length,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Error getting online users for ${client.id}:`, error);
      client.emit('error', { message: 'Failed to get online users' });
    }
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket) {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (clientData) {
        clientData.lastActivity = new Date();
      }

      client.emit('pong', {
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Error handling ping for ${client.id}:`, error);
    }
  }

  // Public methods for broadcasting
  async broadcastToRoom(room: string, event: string, data: any) {
    try {
      this.server.to(room).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug(`Broadcasted ${event} to room ${room}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to room ${room}:`, error);
    }
  }

  async broadcastToUser(userId: string, event: string, data: any) {
    try {
      const room = `user:${userId}`;
      await this.broadcastToRoom(room, event, data);
      this.logger.debug(`Broadcasted ${event} to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to user ${userId}:`, error);
    }
  }

  async broadcastToRole(role: string, event: string, data: any) {
    try {
      const room = `role:${role}`;
      await this.broadcastToRoom(room, event, data);
      this.logger.debug(`Broadcasted ${event} to role ${role}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to role ${role}:`, error);
    }
  }

  async broadcastToAll(event: string, data: any) {
    try {
      this.server.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug(`Broadcasted ${event} to all clients`);
    } catch (error) {
      this.logger.error(`Error broadcasting to all:`, error);
    }
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getOnlineUsers(): any[] {
    return Array.from(this.connectedClients.values())
      .filter(clientData => clientData.userId)
      .map(clientData => ({
        userId: clientData.userId,
        userRole: clientData.userRole,
        lastActivity: clientData.lastActivity,
      }));
  }

  private canJoinRoom(clientData: any, room: string): boolean {
    // Basic permission checks
    if (room.startsWith('user:')) {
      const targetUserId = room.split(':')[1];
      return clientData.userId === targetUserId;
    }

    if (room.startsWith('role:')) {
      const targetRole = room.split(':')[1];
      return clientData.userRole === targetRole;
    }

    // Allow joining public rooms
    if (room.startsWith('public:')) {
      return true;
    }

    // Admin can join any room
    if (clientData.userRole === 'admin') {
      return true;
    }

    return false;
  }

  private startHeartbeat(client: Socket) {
    const interval = setInterval(() => {
      if (!client.connected) {
        clearInterval(interval);
        return;
      }

      client.emit('heartbeat', {
        timestamp: new Date().toISOString(),
      });
    }, 30000); // 30 seconds

    client.on('disconnect', () => {
      clearInterval(interval);
    });
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}