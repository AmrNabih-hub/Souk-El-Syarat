import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '../modules/auth/auth.service';
import { AuthSimulationService } from './simulation/auth-simulation.service';
import { BugBotService } from './bug-bot/bug-bot.service';
import { TestRunnerService } from './test-runner.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService) => ({
        secret: configService.get('JWT_SECRET', 'test-secret'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
          issuer: configService.get('JWT_ISSUER', 'souk-el-syarat'),
          audience: configService.get('JWT_AUDIENCE', 'souk-el-syarat-api'),
        },
      }),
      inject: ['ConfigService'],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [
    AuthService,
    AuthSimulationService,
    BugBotService,
    TestRunnerService,
  ],
  exports: [
    AuthService,
    AuthSimulationService,
    BugBotService,
    TestRunnerService,
  ],
})
export class TestModule {}