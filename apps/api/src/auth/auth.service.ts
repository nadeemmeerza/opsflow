import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from '../users/users.service.js';
import { PasswordService } from './password/password.service.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: { name: string; email: string; password: string }) {
    const email = data.email.toLowerCase().trim();

    const existingUser =
      await this.usersService.findByEmailWithoutPassword(email);

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await this.passwordService.hash(data.password);

    const user = await this.usersService.create({
      name: data.name.trim(),
      email,
      passwordHash,
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  async validateCredentials(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await this.passwordService.verify(
      user.passwordHash,
      password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    };
  }
}
