import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdaptiveService } from './adaptive.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('adaptive')
@Controller('adaptive')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdaptiveController {
  constructor(private adaptiveService: AdaptiveService) {}

  @Post('quiz/generate')
  @ApiOperation({ summary: 'Generate adaptive quiz for user' })
  @ApiResponse({ status: 200, description: 'Adaptive quiz generated successfully' })
  async generateAdaptiveQuiz(@Request() req, @Body() quizData: any) {
    return this.adaptiveService.generateAdaptiveQuiz({
      userId: req.user.id,
      topicId: quizData.topicId,
      sessionContext: quizData.sessionContext,
    });
  }

  @Post('update-model')
  @ApiOperation({ summary: 'Update learning model based on user response' })
  @ApiResponse({ status: 200, description: 'Learning model updated successfully' })
  async updateLearningModel(@Request() req, @Body() updateData: any) {
    return this.adaptiveService.updateLearningModel(
      req.user.id,
      updateData.topicId,
      updateData.questionId,
      updateData.response,
    );
  }

  @Get('learning-path')
  @ApiOperation({ summary: 'Get personalized learning path' })
  @ApiResponse({ status: 200, description: 'Learning path retrieved successfully' })
  async getLearningPath(@Request() req) {
    return this.adaptiveService.getPersonalizedLearningPath(req.user.id);
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Generate personalized feedback' })
  @ApiResponse({ status: 200, description: 'Feedback generated successfully' })
  async getPersonalizedFeedback(@Request() req, @Body() feedbackData: any) {
    return this.adaptiveService.generatePersonalizedFeedback(
      req.user.id,
      feedbackData.questionId,
      feedbackData.isCorrect,
      feedbackData.timeSpent,
    );
  }
}
