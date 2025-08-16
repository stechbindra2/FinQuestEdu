import { Controller, Get, Put, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateUserProfileDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User stats retrieved' })
  async getStats(@Request() req) {
    return this.usersService.getUserStats(req.user.id);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get user learning progress' })
  @ApiResponse({ status: 200, description: 'Progress data retrieved' })
  async getProgress(@Request() req) {
    return this.usersService.getUserProgress(req.user.id);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get user badges' })
  @ApiResponse({ status: 200, description: 'Badge data retrieved' })
  async getBadges(@Request() req) {
    return this.usersService.getUserBadges(req.user.id);
  }

  @Get('classmates')
  @ApiOperation({ summary: 'Get classmates by grade' })
  @ApiResponse({ status: 200, description: 'Classmates data retrieved' })
  async getClassmates(@Request() req) {
    return this.usersService.getClassmatesByGrade(req.user.id);
  }
}
