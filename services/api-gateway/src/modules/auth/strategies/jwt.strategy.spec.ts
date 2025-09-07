import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;
  let configService: ConfigService;

  const mockAuthService = {
    getUserById: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default config values
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        'JWT_SECRET': 'test-secret',
        'JWT_ISSUER': 'souk-el-syarat',
        'JWT_AUDIENCE': 'souk-el-syarat-api',
      };
      return config[key] || defaultValue;
    });
  });

  describe('validate', () => {
    it('should return user for valid payload', async () => {
      // Arrange
      const payload = {
        sub: 'user-id',
        email: 'admin@soukel-syarat.com',
        role: 'admin',
        iat: 1234567890,
        exp: 1234567890 + 900,
      };

      const mockUser = {
        id: 'user-id',
        email: 'admin@soukel-syarat.com',
        role: 'admin',
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.getUserById.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockAuthService.getUserById).toHaveBeenCalledWith('user-id');
    });

    it('should throw UnauthorizedException for invalid payload structure', async () => {
      // Arrange
      const payload = {
        sub: 'user-id',
        // Missing email and role
        iat: 1234567890,
        exp: 1234567890 + 900,
      };

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.getUserById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for user not found', async () => {
      // Arrange
      const payload = {
        sub: 'nonexistent-user-id',
        email: 'admin@soukel-syarat.com',
        role: 'admin',
        iat: 1234567890,
        exp: 1234567890 + 900,
      };

      mockAuthService.getUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.getUserById).toHaveBeenCalledWith('nonexistent-user-id');
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // Arrange
      const payload = {
        sub: 'user-id',
        email: 'admin@soukel-syarat.com',
        role: 'admin',
        iat: 1234567890,
        exp: 1234567890 + 900,
      };

      const mockUser = {
        id: 'user-id',
        email: 'admin@soukel-syarat.com',
        role: 'admin',
        isActive: false, // Inactive user
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.getUserById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for token data mismatch', async () => {
      // Arrange
      const payload = {
        sub: 'user-id',
        email: 'different@example.com', // Different email
        role: 'admin',
        iat: 1234567890,
        exp: 1234567890 + 900,
      };

      const mockUser = {
        id: 'user-id',
        email: 'admin@soukel-syarat.com', // Different from payload
        role: 'admin',
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.getUserById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for role mismatch', async () => {
      // Arrange
      const payload = {
        sub: 'user-id',
        email: 'admin@soukel-syarat.com',
        role: 'customer', // Different role
        iat: 1234567890,
        exp: 1234567890 + 900,
      };

      const mockUser = {
        id: 'user-id',
        email: 'admin@soukel-syarat.com',
        role: 'admin', // Different from payload
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.getUserById.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for service error', async () => {
      // Arrange
      const payload = {
        sub: 'user-id',
        email: 'admin@soukel-syarat.com',
        role: 'admin',
        iat: 1234567890,
        exp: 1234567890 + 900,
      };

      mockAuthService.getUserById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});