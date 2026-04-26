import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import * as path from 'path';
import {
  isMediaCategory,
  isPublicCategory,
  MediaCategory,
} from './media.constants';

export interface UploadedMediaFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class MediaService {
  private readonly mediaRoot: string;
  private readonly maxUploadSizeBytes: number;

  constructor(private readonly config: ConfigService) {
    this.mediaRoot = this.config.get<string>('MEDIA_ROOT', path.resolve(process.cwd(), 'storage'));
    this.maxUploadSizeBytes = this.config.get<number>('MAX_UPLOAD_SIZE_BYTES', 8 * 1024 * 1024);
  }

  async upload(categoryInput: string, file: UploadedMediaFile) {
    if (!isMediaCategory(categoryInput)) {
      throw new BadRequestException('Unsupported media category');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.mimetype) {
      throw new BadRequestException('Unknown file type');
    }

    if (file.size > this.maxUploadSizeBytes) {
      throw new BadRequestException('File too large');
    }

    const ext = this.getExtension(file.originalname, file.mimetype);
    const filename = `${randomUUID()}${ext}`;
    const category = categoryInput as MediaCategory;
    const categoryDir = path.join(this.mediaRoot, category);
    await mkdir(categoryDir, { recursive: true });

    const absolutePath = path.join(categoryDir, filename);
    await writeFile(absolutePath, file.buffer);

    return {
      category,
      filename,
      relativePath: `${category}/${filename}`,
      publicUrl: isPublicCategory(category)
        ? `/api/v1/media/public/${category}/${filename}`
        : null,
    };
  }

  getPublicFilePath(categoryInput: string, filename: string): string {
    if (!isMediaCategory(categoryInput) || !isPublicCategory(categoryInput)) {
      throw new BadRequestException('Unsupported public category');
    }

    const absolutePath = path.join(this.mediaRoot, categoryInput, filename);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File not found');
    }

    return absolutePath;
  }

  getPrivateFilePath(categoryInput: string, filename: string): string {
    if (!isMediaCategory(categoryInput) || isPublicCategory(categoryInput)) {
      throw new BadRequestException('Unsupported private category');
    }

    const absolutePath = path.join(this.mediaRoot, categoryInput, filename);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File not found');
    }

    return absolutePath;
  }

  async remove(categoryInput: string, filename: string) {
    if (!isMediaCategory(categoryInput)) {
      throw new BadRequestException('Unsupported media category');
    }

    const absolutePath = path.join(this.mediaRoot, categoryInput, filename);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File not found');
    }

    await unlink(absolutePath);
    return { success: true };
  }

  private getExtension(originalName: string, mimeType: string): string {
    const extFromName = path.extname(originalName).toLowerCase();

    if (extFromName) {
      return extFromName;
    }

    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
    };

    return map[mimeType] ?? '';
  }
}
