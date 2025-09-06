import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'vendor' | 'customer';
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      issuer: configService.get<string>('JWT_ISSUER', 'souk-el-syarat'),
      audience: configService.get<string>('JWT_AUDIENCE', 'souk-el-syarat-api'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      // Validate payload structure
      if (!payload.sub || !payload.email || !payload.role) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Get user from auth service using the payload
      const user = await this.authService.getUserById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user is still active
      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Verify token hasn't been tampered with
      if (user.email !== payload.email || user.role !== payload.role) {
        throw new UnauthorizedException('Token data mismatch');
      }

      // Return user object (will be attached to request.user)
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token validation failed');
    }
  }
}