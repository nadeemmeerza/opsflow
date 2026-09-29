import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
// import type { SignOptions } from 'jsonwebtoken';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersModule } from '../users/users.module.js';
import { PasswordService } from './password/password.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    UsersModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),

        signOptions: {
          expiresIn: configService.getOrThrow<JwtSignOptions['expiresIn']>(
            'JWT_ACCESS_EXPIRES_IN',
          ),
        },
      }),
    }),
  ],

  providers: [
    AuthService,
    PasswordService,
    JwtStrategy,
  ],

  controllers: [
    AuthController,
  ],

  exports: [
    PassportModule,
  ],
})
export class AuthModule {}