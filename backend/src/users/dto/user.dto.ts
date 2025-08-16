import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';

export enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  KINESTHETIC = 'kinesthetic',
}

export enum PreferredDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(7)
  grade?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  school?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar_url?: string;
}

export class UpdateUserProfileDto {
  @ApiProperty({ enum: LearningStyle, required: false })
  @IsOptional()
  @IsEnum(LearningStyle)
  learning_style?: LearningStyle;

  @ApiProperty({ enum: PreferredDifficulty, required: false })
  @IsOptional()
  @IsEnum(PreferredDifficulty)
  preferred_difficulty?: PreferredDifficulty;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  session_length_preference?: number;
}

export class UserStatsDto {
  @ApiProperty()
  user_id: string;

  @ApiProperty()
  total_xp: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  current_streak: number;

  @ApiProperty()
  longest_streak: number;

  @ApiProperty()
  total_questions_answered: number;

  @ApiProperty()
  total_correct_answers: number;

  @ApiProperty()
  total_time_spent: number;

  @ApiProperty()
  badges_earned: number;

  @ApiProperty({ required: false })
  rank_position?: number;

  @ApiProperty()
  last_activity: string;
}
