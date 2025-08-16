import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurriculumService } from './curriculum.service';
import { CreateTopicDto, UpdateTopicDto, CreateQuestionDto, QuizRequestDto } from './dto/curriculum.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('curriculum')
@Controller('curriculum')
export class CurriculumController {
  constructor(private curriculumService: CurriculumService) {}

  @Get('subjects')
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiResponse({ status: 200, description: 'Subjects retrieved successfully' })
  async getSubjects() {
    return this.curriculumService.getSubjects();
  }

  @Get('topics/grade/:grade')
  @ApiOperation({ summary: 'Get topics by grade level' })
  @ApiResponse({ status: 200, description: 'Topics retrieved successfully' })
  async getTopicsByGrade(@Param('grade') grade: number) {
    return this.curriculumService.getTopicsByGrade(+grade);
  }

  @Get('topics/subject/:subjectId')
  @ApiOperation({ summary: 'Get topics by subject' })
  @ApiQuery({ name: 'grade', required: false })
  @ApiResponse({ status: 200, description: 'Topics retrieved successfully' })
  async getTopicsBySubject(
    @Param('subjectId') subjectId: string,
    @Query('grade') grade?: number,
  ) {
    return this.curriculumService.getTopicsBySubject(subjectId, grade ? +grade : undefined);
  }

  @Get('topics/:topicId')
  @ApiOperation({ summary: 'Get topic details with questions' })
  @ApiResponse({ status: 200, description: 'Topic details retrieved successfully' })
  async getTopicDetails(@Param('topicId') topicId: string) {
    return this.curriculumService.getTopicDetails(topicId);
  }

  @Get('questions/topic/:topicId')
  @ApiOperation({ summary: 'Get questions by topic' })
  @ApiQuery({ name: 'difficulty', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  async getQuestionsByTopic(
    @Param('topicId') topicId: string,
    @Query('difficulty') difficulty?: number,
    @Query('limit') limit?: number,
  ) {
    return this.curriculumService.getQuestionsByTopic(
      topicId,
      difficulty ? +difficulty : undefined,
      limit ? +limit : undefined,
    );
  }

  @Post('quiz/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate adaptive quiz for topic' })
  @ApiResponse({ status: 200, description: 'Quiz generated successfully' })
  async generateQuiz(@Body() quizRequest: QuizRequestDto) {
    const { topic_id, question_count = 5, target_difficulty } = quizRequest;
    
    if (target_difficulty !== undefined) {
      return this.curriculumService.getQuestionsByTopic(topic_id, target_difficulty, question_count);
    }
    
    return this.curriculumService.getRandomQuestions(topic_id, question_count);
  }

  @UseGuards(JwtAuthGuard)
  @Get('progress/overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user progress overview' })
  @ApiResponse({ status: 200, description: 'Progress overview retrieved successfully' })
  async getProgressOverview(@Request() req) {
    return this.curriculumService.getProgressOverview(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mastery/:topicId?')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user topic mastery' })
  @ApiResponse({ status: 200, description: 'Mastery data retrieved successfully' })
  async getUserMastery(@Request() req, @Param('topicId') topicId?: string) {
    return this.curriculumService.getUserTopicMastery(req.user.id, topicId);
  }

  // Admin endpoints for content management
  @UseGuards(JwtAuthGuard)
  @Post('topics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new topic (Admin only)' })
  @ApiResponse({ status: 201, description: 'Topic created successfully' })
  async createTopic(@Body() createTopicDto: CreateTopicDto) {
    return this.curriculumService.createTopic(createTopicDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('topics/:topicId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update topic (Admin only)' })
  @ApiResponse({ status: 200, description: 'Topic updated successfully' })
  async updateTopic(
    @Param('topicId') topicId: string,
    @Body() updateTopicDto: UpdateTopicDto,
  ) {
    return this.curriculumService.updateTopic(topicId, updateTopicDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('questions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new question (Admin only)' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  async createQuestion(@Body() createQuestionDto: CreateQuestionDto) {
    return this.curriculumService.createQuestion(createQuestionDto);
  }
}
