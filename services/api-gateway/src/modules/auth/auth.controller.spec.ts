import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return auth result for valid credentials', async () => {
      // Arrange
      const loginDto = {
        email: 'admin@soukel-syarat.com',
        password: 'admin123',
      };
      
      const mockAuthResult = {
        user: {
          id: 'user-id',
          email: 'admin@soukel-syarat.com',
          role: 'admin',
          isActive: true,
          lastLoginAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      };

      mockAuthService.login.mockResolvedValue(mockAuthResult);

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      // Act
      await controller.login(loginDto, mockResponse as any);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAuthResult);
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      const loginDto = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      // Act
      await controller.login(loginDto, mockResponse as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      });
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      // Arrange
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        role: 'customer',
      };
      
      const mockAuthResult = {
        user: {
          id: 'user-id',
          email: 'newuser@example.com',
          role: 'customer',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      };

      mockAuthService.register.mockResolvedValue(mockAuthResult);

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      // Act
      await controller.register(registerDto, mockResponse as any);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAuthResult);
    });

    it('should return 409 for existing user', async () => {
      // Arrange
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        role: 'customer',
      };

      mockAuthService.register.mockRejectedValue(new Error('User already exists'));

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      // Act
      await controller.register(registerDto, mockResponse as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CONFLICT,
        message: 'User already exists',
        error: 'Conflict',
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const refreshDto = { refreshToken: 'valid-refresh-token' };
      
      const mockResult = {
        accessToken: 'new-access-token',
        expiresIn: 900,
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResult);

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      // Act
      await controller.refreshToken(refreshDto, mockResponse as any);

      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshDto.refreshToken);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 401 for invalid refresh token', async () => {
      // Arrange
      const refreshDto = { refreshToken: 'invalid-refresh-token' };

      mockAuthService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      // Act
      await controller.refreshToken(refreshDto, mockResponse as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid refresh token',
        error: 'Unauthorized',
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      const mockUser = {
        id: 'user-id',
        email: 'admin@soukel-syarat.com',
        role: 'admin',
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRequest = { user: mockUser };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      // Act
      await controller.getProfile(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({ user: mockUser });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Arrange
      const mockRequest = { user: { id: 'user-id' } };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      // Act
      await controller.logout(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Logged out successfully',
      });
    });
  });
});