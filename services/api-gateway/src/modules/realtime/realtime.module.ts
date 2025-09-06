import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RealtimeController } from './realtime.controller';
import { RealtimeService } from './realtime.service';
import { WebSocketGateway } from './websocket.gateway';
import { EventService } from './event.service';
import { NotificationService } from './notification.service';
import { RealtimeMonitoringService } from './realtime-monitoring.service';

@Module({
  imports: [ConfigModule],
  controllers: [RealtimeController],
  providers: [
    RealtimeService,
    WebSocketGateway,
    EventService,
    NotificationService,
    RealtimeMonitoringService,
  ],
  exports: [
    RealtimeService,
    WebSocketGateway,
    EventService,
    NotificationService,
    RealtimeMonitoringService,
  ],
})
export class RealtimeModule {}