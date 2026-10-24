import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
