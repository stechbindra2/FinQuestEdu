import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsJSON, IsInt, Min, Max } from 'class-validator';

export class StartQuizDto {
  @ApiProperty()
  @IsString()
  topic_id: string;

  @ApiProperty({ required: false, default: 'practice' })
  @IsOptional()
  @IsString()
  session_type?: string;

  @ApiProperty({ required: false, minimum: 1, maximum: 20, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  question_count?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  target_difficulty?: number;
}

export class SubmitAnswerDto {
  @ApiProperty()
  @IsString()
  session_id: string;

  @ApiProperty()
  @IsString()
  question_id: string;

  @ApiProperty({ description: 'User selected answer in JSON format' })
  @IsJSON()
  user_answer: any;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  time_spent: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  hints_used?: number;

  @ApiProperty({ required: false, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  confidence_level?: number;
}

export class QuizSessionDto {
  @ApiProperty()
  session_id: string;

  @ApiProperty()
  topic_id: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  questions: any[];

  @ApiProperty()
  current_question: number;

  @ApiProperty()
  total_questions: number;

  @ApiProperty()
  target_difficulty: number;
}

export class CompleteQuizDto {
  @ApiProperty()
  @IsString()
  session_id: string;
}
