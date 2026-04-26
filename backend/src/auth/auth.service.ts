import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { users } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async upsertGoogleLogin(input: {
    email?: string;
    googleSub: string;
    fullName?: string;
    avatarUrl?: string;
  }) {
    if (!input.email) {
      throw new UnauthorizedException('Google profile email is required');
    }

    const user = await this.usersService.upsertGoogleUser({
      email: input.email,
      googleSub: input.googleSub,
      fullName: input.fullName,
      avatarUrl: input.avatarUrl,
    });

    if (!user) {
      throw new UnauthorizedException('Unable to authenticate user');
    }

    const tokens = await this.issueTokens(user);

    return { user, tokens };
  }

  async issueTokens(user: users & { roles?: { role: string }[] }) {
    const roles = user.roles?.map((r) => r.role) ?? [];

    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        roles,
      },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
      },
    );

    const refreshToken = await this.jwt.signAsync(
      {
        sub: user.id,
      },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '30d'),
      },
    );

    return { accessToken, refreshToken };
  }
}
