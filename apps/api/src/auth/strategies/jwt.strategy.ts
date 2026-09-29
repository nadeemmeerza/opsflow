import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../../users/users.service.js';
import { AuthenticatedUser } from '../types/authenticated-user.type.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: configService.getOrThrow<string>(
        'JWT_ACCESS_SECRET',
      ),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
  }): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException(
        'User account is not active',
      );
    }

    return {
      userId: user._id.toString(),
      email: user.email,
    };
  }
}