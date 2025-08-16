import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/database.module';
import { CreateTopicDto, UpdateTopicDto, CreateQuestionDto } from './dto/curriculum.dto';

@Injectable()
export class CurriculumService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async getSubjects() {
    const { data, error } = await this.supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      throw new NotFoundException('Failed to fetch subjects');
    }

    return data;
  }

  async getTopicsByGrade(grade: number) {
    const { data, error } = await this.supabase
      .from('topics')
      .select(`
        *,
        subjects(id, name, color_hex, icon)
      `)
      .eq('grade_level', grade)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      throw new NotFoundException('Failed to fetch topics');
    }

    return data;
  }

  async getTopicsBySubject(subjectId: string, grade?: number) {
    let query = this.supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('is_active', true);

    if (grade) {
      query = query.eq('grade_level', grade);
    }

    const { data, error } = await query.order('sort_order');

    if (error) {
      throw new NotFoundException('Failed to fetch topics');
    }

    return data;
  }

  async getTopicDetails(topicId: string) {
    const { data, error } = await this.supabase
      .from('topics')
      .select(`
        *,
        subjects(id, name, color_hex, icon),
        questions(
          id,
          question_text,
          question_type,
          difficulty_level,
          estimated_time,
          is_active
        )
      `)
      .eq('id', topicId)
      .single();

    if (error) {
      throw new NotFoundException('Topic not found');
    }

    return data;
  }

  async getQuestionsByTopic(topicId: string, difficulty?: number, limit?: number) {
    let query = this.supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)
      .eq('is_active', true);

    if (difficulty !== undefined) {
      // Get questions within difficulty range (±0.1)
      query = query
        .gte('difficulty_level', difficulty - 0.1)
        .lte('difficulty_level', difficulty + 0.1);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query.order('difficulty_level');

    if (error) {
      throw new NotFoundException('Failed to fetch questions');
    }

    return data;
  }

  async getRandomQuestions(topicId: string, count: number = 5, difficultyRange?: { min: number; max: number }) {
    let query = this.supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)
      .eq('is_active', true);

    if (difficultyRange) {
      query = query
        .gte('difficulty_level', difficultyRange.min)
        .lte('difficulty_level', difficultyRange.max);
    }

    const { data, error } = await query;

    if (error) {
      throw new NotFoundException('Failed to fetch questions');
    }

    // Randomly sample questions
    const shuffled = data.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async createTopic(createTopicDto: CreateTopicDto) {
    const { data, error } = await this.supabase
      .from('topics')
      .insert(createTopicDto)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create topic: ${error.message}`);
    }

    return data;
  }

  async updateTopic(topicId: string, updateTopicDto: UpdateTopicDto) {
    const { data, error } = await this.supabase
      .from('topics')
      .update(updateTopicDto)
      .eq('id', topicId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException('Topic not found');
    }

    return data;
  }

  async createQuestion(createQuestionDto: CreateQuestionDto) {
    const { data, error } = await this.supabase
      .from('questions')
      .insert(createQuestionDto)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create question: ${error.message}`);
    }

    return data;
  }

  async updateQuestion(questionId: string, updateData: Partial<CreateQuestionDto>) {
    const { data, error } = await this.supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException('Question not found');
    }

    return data;
  }

  async getUserTopicMastery(userId: string, topicId?: string) {
    let query = this.supabase
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
      .eq('user_id', userId);

    if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      throw new NotFoundException('Mastery data not found');
    }

    return topicId ? data[0] : data;
  }

  async updateTopicMastery(userId: string, topicId: string, masteryUpdate: {
    correct: boolean;
    timeSpent: number;
    difficultyLevel: number;
  }) {
    const { correct, timeSpent, difficultyLevel } = masteryUpdate;

    // Get current mastery data
    const { data: currentMastery } = await this.supabase
      .from('user_topic_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .single();

    if (!currentMastery) {
      // Create new mastery record
      const { data, error } = await this.supabase
        .from('user_topic_mastery')
        .insert({
          user_id: userId,
          topic_id: topicId,
          mastery_score: correct ? 0.1 : 0.05,
          attempts: 1,
          correct_answers: correct ? 1 : 0,
          total_time_spent: timeSpent,
          last_attempted: new Date().toISOString(),
        })
        .select()
        .single();

      return data;
    }

    // Update existing mastery using Bayesian Knowledge Tracing
    const currentScore = currentMastery.mastery_score;
    const attempts = currentMastery.attempts + 1;
    const correctAnswers = currentMastery.correct_answers + (correct ? 1 : 0);
    
    // Simple BKT update (can be made more sophisticated)
    const learningRate = 0.1;
    const guessRate = 0.25; // 25% chance of guessing correctly
    const slipRate = 0.1; // 10% chance of making a mistake when knowing
    
    let newMasteryScore;
    if (correct) {
      newMasteryScore = currentScore + (1 - currentScore) * learningRate;
    } else {
      newMasteryScore = Math.max(0, currentScore - currentScore * learningRate);
    }

    // Determine mastery level
    let masteryLevel = 'novice';
    if (newMasteryScore >= 0.8) masteryLevel = 'advanced';
    else if (newMasteryScore >= 0.6) masteryLevel = 'proficient';
    else if (newMasteryScore >= 0.4) masteryLevel = 'developing';

    const { data, error } = await this.supabase
      .from('user_topic_mastery')
      .update({
        mastery_score: newMasteryScore,
        attempts,
        correct_answers: correctAnswers,
        total_time_spent: currentMastery.total_time_spent + timeSpent,
        last_attempted: new Date().toISOString(),
        mastery_level: masteryLevel,
        is_completed: newMasteryScore >= 0.8,
      })
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update mastery: ${error.message}`);
    }

    return data;
  }

  async getProgressOverview(userId: string) {
    // Get overall progress statistics
    const { data: masteryData } = await this.supabase
      .from('user_topic_mastery')
      .select(`
        mastery_score, 
        mastery_level, 
        topics(
          grade_level, 
          subject_id
        )
      `)
      .eq('user_id', userId);

    if (!masteryData) {
      return {
        totalTopics: 0,
        completedTopics: 0,
        averageMastery: 0,
        gradeProgress: {},
        subjectProgress: {},
      };
    }

    const completedTopics = masteryData.filter(m => m.mastery_score >= 0.8).length;
    const averageMastery = masteryData.reduce((sum, m) => sum + m.mastery_score, 0) / masteryData.length;

    // Group by grade and subject
    const gradeProgress = {};
    const subjectProgress = {};

    masteryData.forEach(mastery => {
      // Fix: Handle topics as object, not array
      const topics = Array.isArray(mastery.topics) ? mastery.topics[0] : mastery.topics;
      const grade = topics?.grade_level;
      const subjectId = topics?.subject_id;

      if (grade) {
        if (!gradeProgress[grade]) gradeProgress[grade] = { total: 0, completed: 0 };
        gradeProgress[grade].total++;
        if (mastery.mastery_score >= 0.8) gradeProgress[grade].completed++;
      }

      if (subjectId) {
        if (!subjectProgress[subjectId]) subjectProgress[subjectId] = { total: 0, completed: 0 };
        subjectProgress[subjectId].total++;
        if (mastery.mastery_score >= 0.8) subjectProgress[subjectId].completed++;
      }
    });

    return {
      totalTopics: masteryData.length,
      completedTopics,
      averageMastery: Math.round(averageMastery * 100) / 100,
      gradeProgress,
      subjectProgress,
    };
  }
}
