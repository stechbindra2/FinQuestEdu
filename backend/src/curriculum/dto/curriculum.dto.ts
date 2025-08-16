import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsBoolean, IsJSON, IsEnum, Min, Max } from 'class-validator';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  DRAG_DROP = 'drag_drop',
  SCENARIO = 'scenario',
  FILL_BLANK = 'fill_blank',
}

export enum CognitiveLevel {
  REMEMBER = 'remember',
  UNDERSTAND = 'understand',
  APPLY = 'apply',
  ANALYZE = 'analyze',
}

export class CreateTopicDto {
  @ApiProperty()
  @IsString()
  subject_id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ minimum: 3, maximum: 7 })
  @IsNumber()
  @Min(3)
  @Max(7)
  grade_level: number;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  difficulty_base: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  learning_objectives: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

export class UpdateTopicDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  difficulty_base?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learning_objectives?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateQuestionDto {
  @ApiProperty()
  @IsString()
  topic_id: string;

  @ApiProperty()
  @IsString()
  question_text: string;

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  question_type: QuestionType;

  @ApiProperty({ required: false, description: 'JSON object with question options' })
  @IsOptional()
  @IsJSON()
  options?: any;

  @ApiProperty({ description: 'JSON object with correct answer and explanation' })
  @IsJSON()
  correct_answer: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  difficulty_level: number;

  @ApiProperty({ enum: CognitiveLevel, required: false })
  @IsOptional()
  @IsEnum(CognitiveLevel)
  cognitive_level?: CognitiveLevel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  estimated_time?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  ai_generated?: boolean;
}

export class QuizRequestDto {
  @ApiProperty()
  @IsString()
  topic_id: string;

  @ApiProperty({ required: false, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  question_count?: number;

  @ApiProperty({ required: false, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  target_difficulty?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  session_type?: string;
}
