import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { app_role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { EnqueueEmailDto } from './dto/enqueue-email.dto';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  @Post('queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(app_role.admin, app_role.editor)
  enqueue(@Body() dto: EnqueueEmailDto) {
    return this.mailService.enqueue(dto);
  }

  @Post('process')
  @HttpCode(200)
  process(
    @Headers('x-worker-key') workerKey: string | undefined,
    @Query('batchSize') batchSize?: string,
  ) {
    const expectedKey = this.config.get<string>('WORKER_API_KEY');

    if (!expectedKey || workerKey !== expectedKey) {
      throw new UnauthorizedException('Invalid worker key');
    }

    const parsedBatch = Number(batchSize ?? '10');
    const safeBatch = Number.isFinite(parsedBatch)
      ? Math.min(100, Math.max(1, parsedBatch))
      : 10;

    return this.mailService.processQueue(safeBatch);
  }
}
