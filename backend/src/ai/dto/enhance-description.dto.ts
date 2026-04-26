import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class EnhanceDescriptionDto {
  @IsString()
  @MinLength(5)
  @MaxLength(8000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  eventName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  eventType?: string;
}
