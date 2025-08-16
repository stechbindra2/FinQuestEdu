import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/database.module';

interface BadgeEvaluationContext {
  eventType: string;
  xpGained: number;
  context?: any;
  currentStats?: any;
}

@Injectable()
export class BadgeService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async checkAndAwardBadges(userId: string, evaluationContext: BadgeEvaluationContext): Promise<any[]> {
    // Get all active badges that user hasn't earned
    const { data: availableBadges } = await this.supabase
      .from('badges')
      .select('*')
      .eq('is_active', true);

    const { data: userBadges } = await this.supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const earnedBadgeIds = userBadges?.map(ub => ub.badge_id) || [];
    const unearned = availableBadges?.filter(badge => !earnedBadgeIds.includes(badge.id)) || [];

    const newlyEarned = [];

    // Evaluate each uneamed badge
    for (const badge of unearned) {
      const shouldAward = await this.evaluateBadgeCriteria(userId, badge, evaluationContext);
      if (shouldAward) {
        const awarded = await this.awardBadge(userId, badge.id);
        if (awarded) {
          newlyEarned.push(badge);
        }
      }
    }

    return newlyEarned;
  }

  async getUserBadges(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('user_badges')
      .select(`
        *,
        badges(
          id,
          name,
          description,
          icon,
          category,
          rarity,
          xp_reward
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Failed to get user badges:', error);
      return [];
    }

    return data || [];
  }

  async getBadgeProgress(userId: string, badgeId: string): Promise<any> {
    const { data: badge } = await this.supabase
      .from('badges')
      .select('*')
      .eq('id', badgeId)
      .single();

    if (!badge) return null;

    const { data: userStats } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!userStats) return null;

    return this.calculateBadgeProgress(badge, userStats);
  }

  calculateBadgeProgress(badge: any, userStats: any): any {
    const criteria = badge.criteria;
    
    switch (criteria.type) {
      case 'quiz_completed':
        return {
          current: userStats.total_questions_answered > 0 ? 1 : 0,
          target: criteria.count,
          progress: Math.min(100, (userStats.total_questions_answered > 0 ? 1 : 0) / criteria.count * 100),
        };
        
      case 'correct_streak':
        return {
          current: userStats.current_streak,
          target: criteria.count,
          progress: Math.min(100, (userStats.current_streak / criteria.count) * 100),
        };
        
      case 'total_xp':
        return {
          current: userStats.total_xp,
          target: criteria.amount,
          progress: Math.min(100, (userStats.total_xp / criteria.amount) * 100),
        };
        
      case 'daily_login':
        return {
          current: userStats.current_streak,
          target: criteria.days,
          progress: Math.min(100, (userStats.current_streak / criteria.days) * 100),
        };
        
      default:
        return { current: 0, target: 1, progress: 0 };
    }
  }

  isCloseToEarning(badge: any, userStats: any): boolean {
    const progress = this.calculateBadgeProgress(badge, userStats);
    return progress.progress >= 75; // Within 25% of earning
  }

  private async evaluateBadgeCriteria(
    userId: string,
    badge: any,
    context: BadgeEvaluationContext
  ): Promise<boolean> {
    const criteria = badge.criteria;
    
    switch (criteria.type) {
      case 'quiz_completed':
        return this.checkQuizCompletedBadge(userId, criteria);
        
      case 'correct_streak':
        return this.checkCorrectStreakBadge(userId, criteria);
        
      case 'subject_mastery':
        return this.checkSubjectMasteryBadge(userId, criteria);
        
      case 'speed_challenge':
        return this.checkSpeedChallengeBadge(userId, criteria, context);
        
      case 'daily_login':
        return this.checkDailyLoginBadge(userId, criteria);
        
      case 'perfect_scores':
        return this.checkPerfectScoresBadge(userId, criteria);
        
      case 'total_xp':
        return this.checkTotalXPBadge(userId, criteria);
        
      case 'topic_explorer':
        return this.checkTopicExplorerBadge(userId, criteria);
        
      default:
        return false;
    }
  }

  private async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      // Get badge details for XP reward
      const { data: badge } = await this.supabase
        .from('badges')
        .select('xp_reward')
        .eq('id', badgeId)
        .single();

      // Award the badge
      const { error: badgeError } = await this.supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId,
          earned_at: new Date().toISOString(),
        });

      if (badgeError) {
        console.error('Failed to award badge:', badgeError);
        return false;
      }

      // Award XP if badge has XP reward
      if (badge?.xp_reward && badge.xp_reward > 0) {
        // Get current stats first
        const { data: currentStats } = await this.supabase
          .from('user_stats')
          .select('total_xp, badges_earned')
          .eq('user_id', userId)
          .single();

        if (currentStats) {
          // Update with calculated values
          await this.supabase
            .from('user_stats')
            .update({
              total_xp: currentStats.total_xp + badge.xp_reward,
              badges_earned: currentStats.badges_earned + 1,
            })
            .eq('user_id', userId);
        }
      }

      return true;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
  }

  private async checkQuizCompletedBadge(userId: string, criteria: any): Promise<boolean> {
    const { data } = await this.supabase
      .from('quiz_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_completed', true);

    return (data?.length || 0) >= criteria.count;
  }

  private async checkCorrectStreakBadge(userId: string, criteria: any): Promise<boolean> {
    const { data: userStats } = await this.supabase
      .from('user_stats')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .single();

    return (userStats?.current_streak || 0) >= criteria.count || 
           (userStats?.longest_streak || 0) >= criteria.count;
  }

  private async checkSubjectMasteryBadge(userId: string, criteria: any): Promise<boolean> {
    const { data } = await this.supabase
      .from('user_topic_mastery')
      .select(`
        mastery_score,
        topics(subject_id)
      `)
      .eq('user_id', userId)
      .eq('topics.subject_id', criteria.subject_id)
      .gte('mastery_score', 0.8);

    // Check if all topics in subject are mastered
    const { data: allTopics } = await this.supabase
      .from('topics')
      .select('id')
      .eq('subject_id', criteria.subject_id)
      .eq('is_active', true);

    const masteredCount = data?.length || 0;
    const totalCount = allTopics?.length || 0;

    return totalCount > 0 && masteredCount >= totalCount;
  }

  private async checkSpeedChallengeBadge(userId: string, criteria: any, context: BadgeEvaluationContext): Promise<boolean> {
    // Check recent responses for speed achievements
    const { data } = await this.supabase
      .from('question_responses')
      .select('time_spent')
      .eq('user_id', userId)
      .eq('is_correct', true)
      .lte('time_spent', criteria.time_limit || 10)
      .order('answered_at', { ascending: false })
      .limit(criteria.questions || 10);

    return (data?.length || 0) >= (criteria.questions || 10);
  }

  private async checkDailyLoginBadge(userId: string, criteria: any): Promise<boolean> {
    const { data: userStats } = await this.supabase
      .from('user_stats')
      .select('current_streak')
      .eq('user_id', userId)
      .single();

    return (userStats?.current_streak || 0) >= criteria.days;
  }

  private async checkPerfectScoresBadge(userId: string, criteria: any): Promise<boolean> {
    const { data } = await this.supabase
      .from('quiz_sessions')
      .select('total_questions, correct_answers')
      .eq('user_id', userId)
      .eq('is_completed', true);

    if (!data) return false;

    const perfectScores = data.filter(session => 
      session.total_questions > 0 && session.correct_answers === session.total_questions
    );

    return perfectScores.length >= criteria.count;
  }

  private async checkTotalXPBadge(userId: string, criteria: any): Promise<boolean> {
    const { data: userStats } = await this.supabase
      .from('user_stats')
      .select('total_xp')
      .eq('user_id', userId)
      .single();

    return (userStats?.total_xp || 0) >= criteria.amount;
  }

  private async checkTopicExplorerBadge(userId: string, criteria: any): Promise<boolean> {
    const { data } = await this.supabase
      .from('user_topic_mastery')
      .select('topic_id')
      .eq('user_id', userId)
      .gt('attempts', 0);

    return (data?.length || 0) >= criteria.topics_count;
  }
}
