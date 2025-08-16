import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/database.module';

@Injectable()
export class LeaderboardService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getGlobalLeaderboard(type: 'xp' | 'streak' | 'weekly' = 'xp', grade?: number, limit: number = 10): Promise<any[]> {
    let query = this.supabase
      .from('users')
      .select(`
        id,
        full_name,
        grade,
        avatar_url,
        user_stats(
          total_xp,
          level,
          current_streak,
          longest_streak,
          badges_earned
        )
      `)
      .eq('role', 'student');

    if (grade) {
      query = query.eq('grade', grade);
    }

    let orderBy = 'user_stats.total_xp';
    if (type === 'streak') {
      orderBy = 'user_stats.current_streak';
    } else if (type === 'weekly') {
      // For weekly, we'll need to calculate this separately
      return this.getWeeklyLeaderboard(grade, limit);
    }

    const { data, error } = await query
      .order(orderBy, { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }

    // Add rank positions and fix user_stats access
    return (data || []).map((user, index) => {
      // Fix: Handle user_stats as array or single object
      const userStats = Array.isArray(user.user_stats) ? user.user_stats[0] : user.user_stats;
      
      return {
        rank: index + 1,
        user: {
          id: user.id,
          name: user.full_name,
          grade: user.grade,
          avatar_url: user.avatar_url,
        },
        stats: userStats,
        score: type === 'streak' ? userStats?.current_streak : userStats?.total_xp,
      };
    });
  }

  async getUserPositions(userId: string): Promise<any[]> {
    const positions = [];

    // Global XP position
    const globalXPPosition = await this.getUserRank(userId, 'global', 'xp');
    if (globalXPPosition) {
      positions.push({
        type: 'global_xp',
        rank: globalXPPosition.rank,
        totalUsers: globalXPPosition.totalUsers,
        score: globalXPPosition.score,
      });
    }

    // Grade XP position
    const gradeXPPosition = await this.getUserRank(userId, 'grade', 'xp');
    if (gradeXPPosition) {
      positions.push({
        type: 'grade_xp',
        rank: gradeXPPosition.rank,
        totalUsers: gradeXPPosition.totalUsers,
        score: gradeXPPosition.score,
      });
    }

    // Streak position
    const streakPosition = await this.getUserRank(userId, 'global', 'streak');
    if (streakPosition) {
      positions.push({
        type: 'streak',
        rank: streakPosition.rank,
        totalUsers: streakPosition.totalUsers,
        score: streakPosition.score,
      });
    }

    return positions;
  }

  async updateUserPosition(userId: string): Promise<void> {
    // This is automatically handled by the leaderboard queries
    // But we could cache positions here if needed for performance
    
    // For now, we'll just update the user's last activity
    await this.supabase
      .from('user_stats')
      .update({ last_activity: new Date().toISOString() })
      .eq('user_id', userId);
  }

  async getClassroomLeaderboard(classroomId: string, type: 'xp' | 'streak' = 'xp', limit: number = 20): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('classroom_students')
      .select(`
        users(
          id,
          full_name,
          avatar_url,
          user_stats(
            total_xp,
            level,
            current_streak,
            badges_earned
          )
        )
      `)
      .eq('classroom_id', classroomId)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to get classroom leaderboard:', error);
      return [];
    }

    // Sort by requested type and fix user_stats access
    const students = (data || [])
      .filter(cs => cs.users)
      .map(cs => {
        // Fix: Handle users as array or single object
        const user = Array.isArray(cs.users) ? cs.users[0] : cs.users;
        // Fix: Handle user_stats as array or single object
        const userStats = Array.isArray(user.user_stats) ? user.user_stats[0] : user.user_stats;
        
        return {
          user: {
            id: user.id,
            name: user.full_name,
            avatar_url: user.avatar_url,
          },
          stats: userStats,
          score: type === 'streak' ? userStats?.current_streak : userStats?.total_xp,
        };
      })
      .filter(student => student.stats) // Only include students with stats
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

    // Add ranks
    return students.map((student, index) => ({
      ...student,
      rank: index + 1,
    }));
  }

  async getTopPerformers(timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly', limit: number = 5): Promise<any[]> {
    const startDate = this.getTimeframeStartDate(timeframe);

    const { data, error } = await this.supabase
      .from('question_responses')
      .select(`
        user_id,
        is_correct,
        answered_at,
        users(
          full_name,
          grade,
          avatar_url
        )
      `)
      .gte('answered_at', startDate.toISOString())
      .eq('is_correct', true);

    if (error) {
      console.error('Failed to get top performers:', error);
      return [];
    }

    // Group by user and count correct answers
    const userPerformance = {};
    (data || []).forEach(response => {
      const userId = response.user_id;
      if (!userPerformance[userId]) {
        userPerformance[userId] = {
          user: response.users,
          correctAnswers: 0,
          userId,
        };
      }
      userPerformance[userId].correctAnswers++;
    });

    // Sort and return top performers
    return Object.values(userPerformance)
      .sort((a: any, b: any) => b.correctAnswers - a.correctAnswers)
      .slice(0, limit)
      .map((performer: any, index) => ({
        rank: index + 1,
        user: {
          id: performer.userId,
          name: performer.user?.full_name,
          grade: performer.user?.grade,
          avatar_url: performer.user?.avatar_url,
        },
        score: performer.correctAnswers,
        metric: 'correct_answers',
      }));
  }

  private async getUserRank(userId: string, scope: 'global' | 'grade', type: 'xp' | 'streak'): Promise<any> {
    // Get user's info first
    const { data: user } = await this.supabase
      .from('users')
      .select(`
        grade,
        user_stats(total_xp, current_streak)
      `)
      .eq('id', userId)
      .single();

    // Fix: Handle user_stats as array or single object
    const userStats = Array.isArray(user?.user_stats) ? user.user_stats[0] : user?.user_stats;
    if (!userStats) return null;

    const userScore = type === 'xp' ? userStats.total_xp : userStats.current_streak;

    // Build query based on scope
    let query = this.supabase
      .from('users')
      .select('user_stats(total_xp, current_streak)')
      .eq('role', 'student');

    if (scope === 'grade' && user?.grade) {
      query = query.eq('grade', user.grade);
    }

    const { data: allUsers } = await query;

    if (!allUsers) return null;

    // Count users with higher scores
    const higherScores = allUsers.filter(u => {
      // Fix: Handle user_stats as array or single object
      const stats = Array.isArray(u.user_stats) ? u.user_stats[0] : u.user_stats;
      const score = type === 'xp' ? stats?.total_xp : stats?.current_streak;
      return (score || 0) > userScore;
    }).length;

    return {
      rank: higherScores + 1,
      totalUsers: allUsers.length,
      score: userScore,
    };
  }

  private async getWeeklyLeaderboard(grade?: number, limit: number = 10): Promise<any[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get all correct responses from the last week
    let query = this.supabase
      .from('question_responses')
      .select(`
        user_id,
        users(
          full_name,
          grade,
          avatar_url,
          user_stats(level, badges_earned)
        )
      `)
      .eq('is_correct', true)
      .gte('answered_at', oneWeekAgo.toISOString());

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get weekly leaderboard:', error);
      return [];
    }

    // Group by user and count weekly XP
    const weeklyScores = {};
    (data || []).forEach(response => {
      const userId = response.user_id;
      // Fix: Handle users as array or single object
      const user = Array.isArray(response.users) ? response.users[0] : response.users;
      const userGrade = user?.grade;
      
      // Filter by grade if specified
      if (grade && userGrade !== grade) return;

      if (!weeklyScores[userId]) {
        weeklyScores[userId] = {
          user: response.users,
          weeklyXP: 0,
          userId,
        };
      }
      weeklyScores[userId].weeklyXP += 10; // Base XP per correct answer
    });

    // Sort and return top performers
    return Object.values(weeklyScores)
      .sort((a: any, b: any) => b.weeklyXP - a.weeklyXP)
      .slice(0, limit)
      .map((entry: any, index) => {
        // Fix: Handle user_stats as array or single object
        const userStats = Array.isArray(entry.user?.user_stats) ? entry.user.user_stats[0] : entry.user?.user_stats;
        
        return {
          rank: index + 1,
          user: {
            id: entry.userId,
            name: entry.user?.full_name,
            grade: entry.user?.grade,
            avatar_url: entry.user?.avatar_url,
          },
          stats: userStats,
          score: entry.weeklyXP,
        };
      });
  }

  private getTimeframeStartDate(timeframe: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'daily':
        now.setHours(0, 0, 0, 0);
        return now;
      case 'weekly':
        const dayOfWeek = now.getDay();
        now.setDate(now.getDate() - dayOfWeek);
        now.setHours(0, 0, 0, 0);
        return now;
      case 'monthly':
        now.setDate(1);
        now.setHours(0, 0, 0, 0);
        return now;
      default:
        return now;
    }
  }
}
