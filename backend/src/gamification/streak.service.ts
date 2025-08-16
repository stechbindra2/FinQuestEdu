import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/database.module';

@Injectable()
export class StreakService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async updateStreak(userId: string, eventType: string, context?: any) {
    const today = new Date().toDateString();
    
    // Get current user stats
    const { data: currentStats } = await this.supabase
      .from('user_stats')
      .select('current_streak, longest_streak, last_activity')
      .eq('user_id', userId)
      .single();

    if (!currentStats) {
      return { currentStreak: 0, milestoneReached: false };
    }

    const lastActivity = currentStats.last_activity ? new Date(currentStats.last_activity).toDateString() : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    let newStreak = currentStats.current_streak;
    let milestoneReached = false;

    // Check if this is a new day
    if (lastActivity !== today) {
      if (lastActivity === yesterdayString) {
        // Consecutive day - increment streak
        newStreak = currentStats.current_streak + 1;
      } else if (lastActivity && lastActivity < yesterdayString) {
        // Streak broken - reset to 1
        newStreak = 1;
      } else if (!lastActivity) {
        // First activity
        newStreak = 1;
      }

      // Check for milestone (every 5 days)
      if (newStreak > 0 && newStreak % 5 === 0) {
        milestoneReached = true;
      }

      // Update stats
      const newLongestStreak = Math.max(currentStats.longest_streak, newStreak);
      
      await this.supabase
        .from('user_stats')
        .update({
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_activity: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    return {
      currentStreak: newStreak,
      milestoneReached,
      longestStreak: Math.max(currentStats.longest_streak, newStreak),
    };
  }

  async getUserStreaks(userId: string) {
    const { data: stats } = await this.supabase
      .from('user_stats')
      .select('current_streak, longest_streak, last_activity')
      .eq('user_id', userId)
      .single();

    return {
      current: stats?.current_streak || 0,
      longest: stats?.longest_streak || 0,
      lastActivity: stats?.last_activity,
      isActiveToday: stats?.last_activity && 
        new Date(stats.last_activity).toDateString() === new Date().toDateString(),
    };
  }

  async getStreakLeaderboard(limit: number = 10) {
    const { data } = await this.supabase
      .from('users')
      .select(`
        id,
        full_name,
        grade,
        user_stats(current_streak, longest_streak)
      `)
      .eq('role', 'student')
      .order('user_stats.current_streak', { ascending: false })
      .limit(limit);

    return data || [];
  }
}
