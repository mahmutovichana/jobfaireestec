import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MediaService, UploadedMediaFile } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload/:category')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('category') category: string,
    @UploadedFile() file: UploadedMediaFile,
  ) {
    if (!file) {
      throw new BadRequestException('Missing multipart file field: file');
    }

    return this.mediaService.upload(category, file);
  }

  @Get('public/:category/:filename')
  async getPublic(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = this.mediaService.getPublicFilePath(category, filename);
    return res.sendFile(filePath);
  }

  @Get('private/:category/:filename')
  @UseGuards(JwtAuthGuard)
  async getPrivate(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = this.mediaService.getPrivateFilePath(category, filename);
    return res.sendFile(filePath);
  }

  @Delete(':category/:filename')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('category') category: string,
    @Param('filename') filename: string,
  ) {
    return this.mediaService.remove(category, filename);
  }
}
