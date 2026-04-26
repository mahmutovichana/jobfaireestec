import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { app_role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { EnhanceDescriptionDto } from './dto/enhance-description.dto';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('enhance-description')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(app_role.admin, app_role.editor)
  enhanceDescription(@Body() dto: EnhanceDescriptionDto) {
    return this.aiService.enhanceDescription(dto);
  }
}
