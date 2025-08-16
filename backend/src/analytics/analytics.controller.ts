import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track user event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  async trackEvent(@Request() req, @Body() eventData: any) {
    return this.analyticsService.trackEvent(
      req.user.id,
      eventData.eventType,
      eventData.data,
      eventData.context,
    );
  }

  @Get('user')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved' })
  async getUserAnalytics(
    @Request() req,
    @Query('timeframe') timeframe: 'day' | 'week' | 'month' = 'week',
  ) {
    return this.analyticsService.getUserAnalytics(req.user.id, timeframe);
  }

  @Get('system')
  @ApiOperation({ summary: 'Get system analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'System analytics retrieved' })
  async getSystemAnalytics(
    @Query('timeframe') timeframe: 'day' | 'week' | 'month' = 'week',
  ) {
    return this.analyticsService.getSystemAnalytics(timeframe);
  }
}
