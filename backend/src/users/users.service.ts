import { Injectable } from '@nestjs/common';
import { app_role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
        roles: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
      include: {
        profile: true,
        roles: true,
      },
    });
  }

  async upsertGoogleUser(input: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
    googleSub: string;
  }) {
    const email = input.email.toLowerCase();

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.users.upsert({
        where: { email },
        create: {
          email,
          full_name: input.fullName,
          avatar_url: input.avatarUrl,
          google_sub: input.googleSub,
        },
        update: {
          full_name: input.fullName,
          avatar_url: input.avatarUrl,
          google_sub: input.googleSub,
        },
      });

      await tx.profiles.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          full_name: input.fullName ?? null,
          avatar_url: input.avatarUrl ?? null,
        },
        update: {
          full_name: input.fullName ?? undefined,
          avatar_url: input.avatarUrl ?? undefined,
        },
      });

      const hasRole = await tx.user_roles.findFirst({
        where: { user_id: user.id },
      });

      if (!hasRole) {
        await tx.user_roles.create({
          data: {
            user_id: user.id,
            role: app_role.viewer,
          },
        });
      }

      return tx.users.findUnique({
        where: { id: user.id },
        include: {
          profile: true,
          roles: true,
        },
      });
    });
  }
}
