import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/database.module';
import { BadgeService } from './badge.service';
import { StreakService } from './streak.service';
import { LeaderboardService } from './leaderboard.service';
import { UsersService } from '../users/users.service';

interface XPEvent {
  userId: string;
  eventType: 'question_correct' | 'quiz_complete' | 'streak_milestone' | 'daily_login' | 'topic_mastery';
  points: number;
  context?: {
    questionDifficulty?: number;
    timeSpent?: number;
    hintsUsed?: number;
    streak?: number;
    topicId?: string;
  };
}

interface GamificationUpdate {
  xpGained: number;
  levelUp: boolean;
  newBadges: any[];
  streakUpdate: any;
  achievements: string[];
  nextLevelProgress: number;
}

@Injectable()
export class GamificationService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private badgeService: BadgeService,
    private streakService: StreakService,
    private leaderboardService: LeaderboardService,
    private usersService: UsersService,
  ) {}

  async processXPEvent(event: XPEvent): Promise<GamificationUpdate> {
    const { userId, eventType, points, context } = event;

    // Calculate bonus XP based on context
    const bonusXP = this.calculateBonusXP(eventType, context);
    const totalXP = points + bonusXP;

    // Update user XP and check for level up
    const xpResult = await this.usersService.updateXP(userId, totalXP);
    
    // Update streak
    const streakUpdate = await this.streakService.updateStreak(userId, eventType, context);
    
    // Check for new badges
    const newBadges = await this.badgeService.checkAndAwardBadges(userId, {
      eventType,
      xpGained: totalXP,
      context,
      currentStats: xpResult,
    });

    // Update leaderboards
    await this.leaderboardService.updateUserPosition(userId);

    // Generate achievements list
    const achievements = this.generateAchievements(eventType, context, streakUpdate, newBadges);

    return {
      xpGained: totalXP,
      levelUp: xpResult?.levelUp || false,
      newBadges,
      streakUpdate,
      achievements,
      nextLevelProgress: this.calculateNextLevelProgress(xpResult?.newTotalXP || 0, xpResult?.newLevel || 1),
    };
  }

  async getUserGameStats(userId: string): Promise<{
    stats: any;
    badges: any[];
    streaks: any;
    leaderboardPositions: any[];
    weeklyProgress: any;
    achievements: any[];
  }> {
    // Get user stats
    const stats = await this.usersService.getUserStats(userId);
    
    // Get user badges
    const badges = await this.badgeService.getUserBadges(userId);
    
    // Get streak information
    const streaks = await this.streakService.getUserStreaks(userId);
    
    // Get leaderboard positions
    const leaderboardPositions = await this.leaderboardService.getUserPositions(userId);
    
    // Get weekly progress
    const weeklyProgress = await this.getWeeklyProgress(userId);
    
    // Get recent achievements
    const achievements = await this.getRecentAchievements(userId);

    return {
      stats,
      badges,
      streaks,
      leaderboardPositions,
      weeklyProgress,
      achievements,
    };
  }

  async getGlobalLeaderboard(type: 'xp' | 'streak' | 'weekly' = 'xp', grade?: number, limit: number = 10): Promise<any[]> {
    return this.leaderboardService.getGlobalLeaderboard(type, grade, limit);
  }

  async getUserMotivation(userId: string): Promise<{
    motivationLevel: number;
    suggestedActions: string[];
    encouragementMessage: string;
    nextMilestone: any;
  }> {
    const stats = await this.usersService.getUserStats(userId);
    const recentActivity = await this.getRecentActivity(userId);
    
    // Calculate motivation level (0-1)
    const motivationLevel = this.calculateMotivationLevel(stats, recentActivity);
    
    // Generate personalized suggestions
    const suggestedActions = this.generateSuggestedActions(stats, motivationLevel);
    
    // Create encouraging message
    const encouragementMessage = this.generateEncouragementMessage(stats, motivationLevel);
    
    // Find next achievement milestone
    const nextMilestone = await this.getNextMilestone(userId, stats);

    return {
      motivationLevel,
      suggestedActions,
      encouragementMessage,
      nextMilestone,
    };
  }

  async createCustomChallenge(userId: string, challengeType: 'daily' | 'weekly' | 'topic'): Promise<any> {
    const userStats = await this.usersService.getUserStats(userId);
    const userProgress = await this.usersService.getUserProgress(userId);
    
    let challenge;
    
    switch (challengeType) {
      case 'daily':
        challenge = this.createDailyChallenge(userStats);
        break;
      case 'weekly':
        challenge = this.createWeeklyChallenge(userStats, userProgress);
        break;
      case 'topic':
        challenge = this.createTopicChallenge(userProgress);
        break;
    }

    // Store challenge in database
    const { data, error } = await this.supabase
      .from('user_challenges')
      .insert({
        user_id: userId,
        challenge_type: challengeType,
        challenge_data: challenge,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (challengeType === 'daily' ? 24 : 168) * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    return data;
  }

  private calculateBonusXP(eventType: string, context?: any): number {
    let bonus = 0;

    switch (eventType) {
      case 'question_correct':
        // Difficulty bonus
        if (context?.questionDifficulty) {
          bonus += Math.round(context.questionDifficulty * 20);
        }
        
        // Speed bonus
        if (context?.timeSpent && context.timeSpent < 30) {
          bonus += 5;
        }
        
        // No-hints bonus
        if (!context?.hintsUsed || context.hintsUsed === 0) {
          bonus += 3;
        }
        break;
        
      case 'quiz_complete':
        // Perfect score bonus
        bonus += 10;
        break;
        
      case 'streak_milestone':
        if (context?.streak) {
          bonus += Math.min(50, context.streak * 2);
        }
        break;
        
      case 'topic_mastery':
        bonus += 25;
        break;
    }

    return bonus;
  }

  private generateAchievements(eventType: string, context?: any, streakUpdate?: any, newBadges?: any[]): string[] {
    const achievements = [];

    if (newBadges && newBadges.length > 0) {
      achievements.push(...newBadges.map(badge => `Earned ${badge.name} badge!`));
    }

    if (streakUpdate?.milestoneReached) {
      achievements.push(`${streakUpdate.currentStreak} day streak!`);
    }

    if (eventType === 'topic_mastery') {
      achievements.push('Topic mastered!');
    }

    return achievements;
  }

  private calculateNextLevelProgress(totalXP: number, currentLevel: number): number {
    const xpForCurrentLevel = (currentLevel - 1) * 1000;
    const xpForNextLevel = currentLevel * 1000;
    const progressXP = totalXP - xpForCurrentLevel;
    
    return Math.round((progressXP / 1000) * 100);
  }

  private async getWeeklyProgress(userId: string): Promise<any> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: weeklyResponses } = await this.supabase
      .from('question_responses')
      .select('answered_at, is_correct')
      .eq('user_id', userId)
      .gte('answered_at', oneWeekAgo.toISOString())
      .order('answered_at');

    if (!weeklyResponses) return { dailyActivity: [], totalQuestions: 0, accuracy: 0 };

    // Group by day
    const dailyActivity = {};
    weeklyResponses.forEach(response => {
      const day = response.answered_at.split('T')[0];
      if (!dailyActivity[day]) {
        dailyActivity[day] = { total: 0, correct: 0 };
      }
      dailyActivity[day].total++;
      if (response.is_correct) dailyActivity[day].correct++;
    });

    const totalCorrect = weeklyResponses.filter(r => r.is_correct).length;

    return {
      dailyActivity: Object.entries(dailyActivity).map(([date, stats]: [string, any]) => ({
        date,
        questions: stats.total,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      })),
      totalQuestions: weeklyResponses.length,
      accuracy: weeklyResponses.length > 0 ? (totalCorrect / weeklyResponses.length) * 100 : 0,
    };
  }

  private async getRecentAchievements(userId: string): Promise<any[]> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentBadges } = await this.supabase
      .from('user_badges')
      .select(`
        earned_at,
        badges(name, description, icon, rarity)
      `)
      .eq('user_id', userId)
      .gte('earned_at', oneDayAgo.toISOString())
      .order('earned_at', { ascending: false });

    return recentBadges || [];
  }

  private async getRecentActivity(userId: string): Promise<any> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: recentSessions } = await this.supabase
      .from('quiz_sessions')
      .select('started_at, completion_rate, correct_answers, total_questions')
      .eq('user_id', userId)
      .gte('started_at', threeDaysAgo.toISOString())
      .order('started_at', { ascending: false });

    return recentSessions || [];
  }

  private calculateMotivationLevel(stats: any, recentActivity: any[]): number {
    let motivation = 0.5; // Base motivation

    // Recent activity boost
    const sessionsLast3Days = recentActivity.length;
    motivation += Math.min(0.3, sessionsLast3Days * 0.1);

    // Streak boost
    if (stats.current_streak > 0) {
      motivation += Math.min(0.2, stats.current_streak * 0.02);
    }

    // Recent performance
    if (recentActivity.length > 0) {
      const avgAccuracy = recentActivity.reduce((sum, s) => 
        sum + (s.total_questions > 0 ? s.correct_answers / s.total_questions : 0), 0
      ) / recentActivity.length;
      motivation += avgAccuracy * 0.2;
    }

    return Math.min(1, Math.max(0, motivation));
  }

  private generateSuggestedActions(stats: any, motivationLevel: number): string[] {
    const actions = [];

    if (motivationLevel < 0.4) {
      actions.push('Try an easier topic to build confidence');
      actions.push('Take a short break and come back refreshed');
      actions.push('Review your progress - you\'ve come so far!');
    } else if (motivationLevel < 0.7) {
      actions.push('Challenge yourself with a harder question');
      actions.push('Try to beat your personal best');
      actions.push('Explore a new topic');
    } else {
      actions.push('You\'re on fire! Keep the momentum going');
      actions.push('Share your progress with friends');
      actions.push('Try the weekly challenge');
    }

    // Add streak-specific suggestions
    if (stats.current_streak === 0) {
      actions.push('Start a new learning streak today!');
    } else if (stats.current_streak < 3) {
      actions.push(`Keep your ${stats.current_streak}-day streak alive!`);
    }

    return actions.slice(0, 3); // Return top 3 suggestions
  }

  private generateEncouragementMessage(stats: any, motivationLevel: number): string {
    const messages = {
      low: [
        "Every expert was once a beginner. You're doing great! 💪",
        "Learning takes time, and you're making progress every day! 🌱",
        "Remember, it's not about being perfect - it's about getting better! ⭐",
      ],
      medium: [
        "You're really getting the hang of this! Keep it up! 🚀",
        "Your hard work is paying off - way to go! 🎉",
        "You're building great money habits that will last a lifetime! 💰",
      ],
      high: [
        "Wow! You're absolutely crushing it! 🔥",
        "You're a financial literacy superstar! ⭐",
        "Your dedication is inspiring - keep leading by example! 👑",
      ],
    };

    let category = 'medium';
    if (motivationLevel < 0.4) category = 'low';
    else if (motivationLevel > 0.7) category = 'high';

    const categoryMessages = messages[category];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }

  private async getNextMilestone(userId: string, stats: any): Promise<any> {
    // Check XP milestone
    const nextLevelXP = stats.level * 1000;
    const xpToNext = nextLevelXP - stats.total_xp;
    
    if (xpToNext <= 100) {
      return {
        type: 'level_up',
        description: `Level ${stats.level + 1}`,
        progress: ((stats.total_xp % 1000) / 1000) * 100,
        remaining: xpToNext,
      };
    }

    // Check badge milestones
    const { data: availableBadges } = await this.supabase
      .from('badges')
      .select('*')
      .eq('is_active', true);

    const userBadges = await this.badgeService.getUserBadges(userId);
    const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
    
    const nextBadge = availableBadges?.find(badge => 
      !earnedBadgeIds.includes(badge.id) && this.badgeService.isCloseToEarning(badge, stats)
    );

    if (nextBadge) {
      return {
        type: 'badge',
        description: nextBadge.name,
        icon: nextBadge.icon,
        progress: this.badgeService.calculateBadgeProgress(nextBadge, stats),
      };
    }

    // Default: next level
    return {
      type: 'level_up',
      description: `Level ${stats.level + 1}`,
      progress: ((stats.total_xp % 1000) / 1000) * 100,
      remaining: xpToNext,
    };
  }

  private createDailyChallenge(userStats: any): any {
    const challenges = [
      {
        title: 'Question Master',
        description: 'Answer 5 questions correctly today',
        target: 5,
        progress: 0,
        reward: { xp: 25, badge: null },
      },
      {
        title: 'Speed Demon',
        description: 'Answer 3 questions in under 20 seconds each',
        target: 3,
        progress: 0,
        reward: { xp: 30, badge: null },
      },
      {
        title: 'Perfect Score',
        description: 'Complete a quiz with 100% accuracy',
        target: 1,
        progress: 0,
        reward: { xp: 40, badge: null },
      },
    ];

    // Select challenge based on user level
    const difficultyIndex = Math.min(2, Math.floor(userStats.level / 3));
    return challenges[difficultyIndex];
  }

  private createWeeklyChallenge(userStats: any, userProgress: any[]): any {
    const challenges = [
      {
        title: 'Topic Explorer',
        description: 'Try questions from 3 different topics',
        target: 3,
        progress: 0,
        reward: { xp: 100, badge: 'explorer' },
      },
      {
        title: 'Consistency Champion',
        description: 'Practice for 5 days this week',
        target: 5,
        progress: 0,
        reward: { xp: 150, badge: 'consistent' },
      },
      {
        title: 'Mastery Seeker',
        description: 'Achieve 80% mastery in any topic',
        target: 1,
        progress: 0,
        reward: { xp: 200, badge: 'master' },
      },
    ];

    // Select based on current progress
    const masteryCount = userProgress.filter(p => p.mastery_score >= 0.8).length;
    const challengeIndex = masteryCount < 2 ? 0 : (masteryCount < 5 ? 1 : 2);
    
    return challenges[challengeIndex];
  }

  private createTopicChallenge(userProgress: any[]): any {
    // Find a topic that needs work
    const strugglingTopic = userProgress.find(p => 
      p.mastery_score < 0.6 && p.attempts > 2
    );

    if (strugglingTopic) {
      return {
        title: `${strugglingTopic.topics?.name} Focus`,
        description: `Improve your mastery in ${strugglingTopic.topics?.name} to 70%`,
        target: 0.7,
        progress: strugglingTopic.mastery_score,
        reward: { xp: 75, badge: null },
        topicId: strugglingTopic.topic_id,
      };
    }

    // Default challenge
    return {
      title: 'New Topic Adventure',
      description: 'Try a new topic and answer 3 questions',
      target: 3,
      progress: 0,
      reward: { xp: 50, badge: null },
    };
  }
}
