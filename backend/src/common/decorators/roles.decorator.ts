import { SetMetadata } from '@nestjs/common';
import { app_role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: app_role[]) => SetMetadata(ROLES_KEY, roles);
