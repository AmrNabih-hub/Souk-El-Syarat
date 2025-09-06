import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('API Gateway');
  
  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    const environment = configService.get<string>('NODE_ENV', 'development');

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // Compression middleware
    app.use(compression());

    // CORS configuration
    app.enableCors({
      origin: configService.get<string>('CORS_ORIGIN', '*'),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Swagger documentation
    if (environment !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Souk El-Syarat API Gateway')
        .setDescription('Ultimate Professional API Gateway for Souk El-Syarat Platform')
        .setVersion('1.0.0')
        .addBearerAuth()
        .addTag('Health', 'Health check endpoints')
        .addTag('Auth', 'Authentication endpoints')
        .addTag('Users', 'User management endpoints')
        .addTag('Products', 'Product catalog endpoints')
        .addTag('Orders', 'Order management endpoints')
        .addTag('Payments', 'Payment processing endpoints')
        .addTag('Notifications', 'Notification endpoints')
        .addTag('Analytics', 'Analytics endpoints')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });

      logger.log(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);
    }

    // Health check endpoint
    app.use('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment,
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('🛑 SIGTERM received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('🛑 SIGINT received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });

    // Start the server
    await app.listen(port, '0.0.0.0');
    
    logger.log(`🚀 API Gateway is running on port ${port}`);
    logger.log(`🌍 Environment: ${environment}`);
    logger.log(`📊 Health check: http://localhost:${port}/health`);
    
    if (environment !== 'production') {
      logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
    }

  } catch (error) {
    logger.error('❌ Failed to start API Gateway', error);
    process.exit(1);
  }
}

bootstrap();