import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('google/start')
  @UseGuards(AuthGuard('google'))
  startGoogleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async handleGoogleCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as
      | {
          email?: string;
          googleSub: string;
          fullName?: string;
          avatarUrl?: string;
        }
      | undefined;

    if (!googleUser) {
      throw new UnauthorizedException('Google authentication failed');
    }

    const { user, tokens } = await this.authService.upsertGoogleLogin(googleUser);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'https://jobfair.ba');
    const redirectUrl = new URL(frontendUrl);
    redirectUrl.searchParams.set('token', tokens.accessToken);

    return res.redirect(redirectUrl.toString());
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    const user = req.user as any;
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      profile: user.profile,
      roles: user.roles,
    };
  }
}
