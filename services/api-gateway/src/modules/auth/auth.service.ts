import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'vendor' | 'customer';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  role: 'admin' | 'vendor' | 'customer';
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly users: Map<string, User> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.initializeDefaultUsers();
  }

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await this.findUserByEmail(email);
      
      if (!user || !user.isActive) {
        this.logger.warn(`Authentication failed: User ${email} not found or inactive`);
        return null;
      }

      const isPasswordValid = await compare(password, user.password);
      
      if (!isPasswordValid) {
        this.logger.warn(`Authentication failed: Invalid password for user ${email}`);
        return null;
      }

      // Update last login
      user.lastLoginAt = new Date();
      this.users.set(user.id, user);

      this.logger.log(`User ${email} authenticated successfully`);
      
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error(`Authentication error for user ${email}:`, error);
      return null;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' }
    );

    const expiresIn = this.getTokenExpirationTime();

    this.logger.log(`User ${user.email} logged in successfully`);

    return {
      user,
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await this.findUserByEmail(registerDto.email);
      if (existingUser) {
        throw new UnauthorizedException('User already exists');
      }

      // Hash password
      const hashedPassword = await hash(registerDto.password, 12);

      // Create user
      const user: User = {
        id: uuidv4(),
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.users.set(user.id, user);

      // Generate tokens
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(
        { sub: user.id, type: 'refresh' },
        { expiresIn: '7d' }
      );

      const expiresIn = this.getTokenExpirationTime();

      this.logger.log(`User ${user.email} registered successfully`);

      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      this.logger.error(`Registration error for user ${registerDto.email}:`, error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = this.users.get(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
      };

      const accessToken = this.jwtService.sign(newPayload);
      const expiresIn = this.getTokenExpirationTime();

      this.logger.log(`Token refreshed for user ${user.email}`);

      return { accessToken, expiresIn };
    } catch (error) {
      this.logger.error('Token refresh error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateToken(token: string): Promise<Omit<User, 'password'> | null> {
    try {
      const payload = this.jwtService.verify(token);
      const user = this.users.get(payload.sub);
      
      if (!user || !user.isActive) {
        return null;
      }

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error('Token validation error:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    try {
      const user = this.users.get(userId);
      
      if (!user || !user.isActive) {
        return null;
      }

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error('Get user by ID error:', error);
      return null;
    }
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  private getTokenExpirationTime(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const timeValue = parseInt(expiresIn);
    const timeUnit = expiresIn.slice(-1);
    
    switch (timeUnit) {
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 3600;
      case 'd': return timeValue * 86400;
      default: return 900; // 15 minutes default
    }
  }

  private initializeDefaultUsers(): void {
    // Initialize with default admin user for testing
    const adminUser: User = {
      id: uuidv4(),
      email: 'admin@soukel-syarat.com',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2O', // 'admin123'
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);
    this.logger.log('Default admin user initialized');
  }
}