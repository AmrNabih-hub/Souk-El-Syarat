import { Controller, Post, Body, HttpStatus, Res, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService, LoginDto, RegisterDto, AuthResult } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            email: { type: 'string', example: 'user@example.com' },
            role: { type: 'string', enum: ['admin', 'vendor', 'customer'] },
            isActive: { type: 'boolean', example: true },
            lastLoginAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        accessToken: { type: 'string', example: 'jwt-token' },
        refreshToken: { type: 'string', example: 'refresh-token' },
        expiresIn: { type: 'number', example: 900 }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials'
  })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      const result = await this.authService.login(loginDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: error.message || 'Invalid credentials',
        error: 'Unauthorized'
      });
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            email: { type: 'string', example: 'user@example.com' },
            role: { type: 'string', enum: ['admin', 'vendor', 'customer'] },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        accessToken: { type: 'string', example: 'jwt-token' },
        refreshToken: { type: 'string', example: 'refresh-token' },
        expiresIn: { type: 'number', example: 900 }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exists'
  })
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    try {
      const result = await this.authService.register(registerDto);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      const statusCode = error.message.includes('already exists') 
        ? HttpStatus.CONFLICT 
        : HttpStatus.BAD_REQUEST;
      
      return res.status(statusCode).json({
        statusCode,
        message: error.message || 'Registration failed',
        error: statusCode === HttpStatus.CONFLICT ? 'Conflict' : 'Bad Request'
      });
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'new-jwt-token' },
        expiresIn: { type: 'number', example: 900 }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token'
  })
  async refreshToken(@Body() body: { refreshToken: string }, @Res() res: Response) {
    try {
      const result = await this.authService.refreshToken(body.refreshToken);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: error.message || 'Invalid refresh token',
        error: 'Unauthorized'
      });
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            email: { type: 'string', example: 'user@example.com' },
            role: { type: 'string', enum: ['admin', 'vendor', 'customer'] },
            isActive: { type: 'boolean', example: true },
            lastLoginAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized'
  })
  async getProfile(@Request() req: any, @Res() res: Response) {
    try {
      return res.status(HttpStatus.OK).json({
        user: req.user
      });
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        error: 'Unauthorized'
      });
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged out successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized'
  })
  async logout(@Request() req: any, @Res() res: Response) {
    try {
      // In a real implementation, you would invalidate the token
      // For now, we'll just return a success message
      return res.status(HttpStatus.OK).json({
        message: 'Logged out successfully'
      });
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        error: 'Unauthorized'
      });
    }
  }
}