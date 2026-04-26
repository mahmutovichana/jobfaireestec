import { IsEmail, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class EnqueueEmailDto {
  @IsString()
  @MaxLength(120)
  queueName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  messageId?: string;

  @IsEmail()
  recipientEmail!: string;

  @IsString()
  @MaxLength(200)
  subject!: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
