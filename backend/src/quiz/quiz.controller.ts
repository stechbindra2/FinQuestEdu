import { Controller, Post, Body, UseGuards, Request, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { StartQuizDto, SubmitAnswerDto } from './dto/quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('quiz')
@Controller('quiz')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuizController {
  constructor(private quizService: QuizService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new quiz session' })
  @ApiResponse({ status: 201, description: 'Quiz session started successfully' })
  async startQuiz(@Request() req, @Body() startQuizDto: StartQuizDto) {
    return this.quizService.startQuizSession(req.user.id, startQuizDto);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit answer for current question' })
  @ApiResponse({ status: 200, description: 'Answer submitted successfully' })
  async submitAnswer(@Request() req, @Body() submitAnswerDto: SubmitAnswerDto) {
    return this.quizService.submitAnswer(req.user.id, submitAnswerDto);
  }

  @Post('complete/:sessionId')
  @ApiOperation({ summary: 'Complete quiz session' })
  @ApiResponse({ status: 200, description: 'Quiz session completed' })
  async completeQuiz(@Request() req, @Param('sessionId') sessionId: string) {
    return this.quizService.completeQuizSession(req.user.id, sessionId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user quiz history' })
  @ApiResponse({ status: 200, description: 'Quiz history retrieved' })
  async getQuizHistory(@Request() req) {
    return this.quizService.getUserQuizHistory(req.user.id);
  }
}
