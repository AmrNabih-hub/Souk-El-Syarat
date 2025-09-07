import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService, LoginDto, RegisterDto } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default config values
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        'JWT_SECRET': 'test-secret',
        'JWT_EXPIRES_IN': '15m',
        'JWT_ISSUER': 'souk-el-syarat',
        'JWT_AUDIENCE': 'souk-el-syarat-api',
      };
      return config[key] || defaultValue;
    });
  });

  describe('validateUser', () => {
    it('should return user without password for valid credentials', async () => {
      // Arrange
      const email = 'admin@soukel-syarat.com';
      const password = 'admin123';

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe(email);
      expect(result?.role).toBe('admin');
      expect(result).not.toHaveProperty('password');
    });

    it('should return null for invalid email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      // Arrange
      const email = 'admin@soukel-syarat.com';
      const password = 'wrongpassword';

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return auth result for valid credentials', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'admin@soukel-syarat.com',
        password: 'admin123',
      };
      
      mockJwtService.sign.mockReturnValue('mock-access-token');
      mockJwtService.sign.mockReturnValueOnce('mock-access-token');
      mockJwtService.sign.mockReturnValueOnce('mock-refresh-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.expiresIn).toBeDefined();
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        role: 'customer',
      };
      
      mockJwtService.sign.mockReturnValue('mock-access-token');
      mockJwtService.sign.mockReturnValueOnce('mock-access-token');
      mockJwtService.sign.mockReturnValueOnce('mock-refresh-token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.role).toBe(registerDto.role);
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should throw UnauthorizedException for existing user', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'admin@soukel-syarat.com', // Already exists
        password: 'password123',
        role: 'customer',
      };

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const mockPayload = { sub: 'user-id', type: 'refresh' };
      
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockJwtService.sign.mockReturnValue('new-access-token');

      // Act
      const result = await service.refreshToken(refreshToken);

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new-access-token');
      expect(result.expiresIn).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';
      
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      // Arrange
      const token = 'valid-token';
      const mockPayload = { sub: 'user-id' };
      
      mockJwtService.verify.mockReturnValue(mockPayload);

      // Act
      const result = await service.validateToken(token);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('user-id');
    });

    it('should return null for invalid token', async () => {
      // Arrange
      const token = 'invalid-token';
      
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await service.validateToken(token);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user for valid ID', async () => {
      // Arrange
      const userId = 'admin-user-id'; // From default admin user

      // Act
      const result = await service.getUserById(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe('admin@soukel-syarat.com');
    });

    it('should return null for invalid ID', async () => {
      // Arrange
      const userId = 'nonexistent-id';

      // Act
      const result = await service.getUserById(userId);

      // Assert
      expect(result).toBeNull();
    });
  });
});