import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InterServiceCommunicationService {
  private readonly logger = new Logger(InterServiceCommunicationService.name);

  constructor() {
    this.logger.log('Inter-Service Communication Service initialized');
  }

  async sendMessage(service: string, message: any): Promise<any> {
    this.logger.debug(`Sending message to service ${service}:`, message);
    return { success: true, message: 'Message sent successfully' };
  }
}