import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/database.module';
import { UpdateUserDto, UserStatsDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        user_profiles(*),
        user_stats(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundException('User not found');
    }

    return data;
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updateUserDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new NotFoundException('User not found');
    }

    return data;
  }

  async getUserStats(userId: string): Promise<UserStatsDto> {
    const { data, error } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new NotFoundException('User stats not found');
    }

    return data;
  }

  async initializeUserStats(userId: string) {
    const { data, error } = await this.supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        total_xp: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
        total_questions_answered: 0,
        total_correct_answers: 0,
        total_time_spent: 0,
        badges_earned: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to initialize user stats:', error);
    }

    return data;
  }

  async createUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        learning_style: 'visual',
        preferred_difficulty: 'medium',
        session_length_preference: 15,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create user profile:', error);
    }

    return data;
  }

  async updateLastActivity(userId: string) {
    const { error } = await this.supabase
      .from('user_stats')
      .update({ last_activity: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  async getUserProgress(userId: string) {
    const { data, error } = await this.supabase
      .from('user_topic_mastery')
      .select(`
        *,
        topics(
          id,
          name,
          description,
          grade_level,
          subjects(name, color_hex, icon)
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new NotFoundException('Progress data not found');
    }

    return data;
  }

  async getUserBadges(userId: string) {
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
      throw new NotFoundException('Badge data not found');
    }

    return data;
  }

  async getClassmatesByGrade(userId: string, limit: number = 10) {
    // First get current user's grade
    const { data: currentUser } = await this.supabase
      .from('users')
      .select('grade')
      .eq('id', userId)
      .single();

    if (!currentUser?.grade) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('users')
      .select(`
        id,
        full_name,
        avatar_url,
        user_stats(total_xp, level, current_streak)
      `)
      .eq('grade', currentUser.grade)
      .eq('role', 'student')
      .neq('id', userId)
      .order('user_stats.total_xp', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return data;
  }

  async updateXP(userId: string, xpGained: number) {
    const { data: currentStats } = await this.supabase
      .from('user_stats')
      .select('total_xp, level')
      .eq('user_id', userId)
      .single();

    if (!currentStats) return;

    const newTotalXP = currentStats.total_xp + xpGained;
    const newLevel = Math.floor(newTotalXP / 1000) + 1; // 1000 XP per level

    const { error } = await this.supabase
      .from('user_stats')
      .update({
        total_xp: newTotalXP,
        level: newLevel,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to update XP:', error);
    }

    return { newTotalXP, newLevel, levelUp: newLevel > currentStats.level };
  }
}
