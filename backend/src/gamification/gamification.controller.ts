import { Controller, Get, Post, UseGuards, Request, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(
    private gamificationService: GamificationService,
    private leaderboardService: LeaderboardService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get user gamification stats' })
  @ApiResponse({ status: 200, description: 'User stats retrieved successfully' })
  async getUserStats(@Request() req) {
    return this.gamificationService.getUserGameStats(req.user.id);
  }

  @Get('leaderboard/:type')
  @ApiOperation({ summary: 'Get leaderboard by type' })
  @ApiQuery({ name: 'grade', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved successfully' })
  async getLeaderboard(
    @Param('type') type: 'xp' | 'streak' | 'weekly',
    @Query('grade') grade?: number,
    @Query('limit') limit?: number,
  ) {
    return this.leaderboardService.getGlobalLeaderboard(type, grade, limit || 10);
  }

  @Get('motivation')
  @ApiOperation({ summary: 'Get user motivation data' })
  @ApiResponse({ status: 200, description: 'Motivation data retrieved successfully' })
  async getMotivation(@Request() req) {
    return this.gamificationService.getUserMotivation(req.user.id);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get user badges' })
  @ApiResponse({ status: 200, description: 'User badges retrieved successfully' })
  async getUserBadges(@Request() req) {
    return this.gamificationService.getUserGameStats(req.user.id);
  }

  @Post('challenge/:type')
  @ApiOperation({ summary: 'Create custom challenge' })
  @ApiResponse({ status: 201, description: 'Challenge created successfully' })
  async createChallenge(
    @Request() req,
    @Param('type') type: 'daily' | 'weekly' | 'topic',
  ) {
    return this.gamificationService.createCustomChallenge(req.user.id, type);
  }
}
