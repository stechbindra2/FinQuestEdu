import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/database.module';
import { ContextualBanditService } from './contextual-bandit.service';
import { AiContentService } from './ai-content.service';
import { CurriculumService } from '../curriculum/curriculum.service';

interface AdaptiveQuizRequest {
  userId: string;
  topicId: string;
  sessionContext?: {
    timeOfDay?: string;
    deviceType?: string;
    sessionLength?: number;
  };
}

interface AdaptiveQuizResponse {
  questions: any[];
  difficultyProgression: number[];
  personalizedHints: boolean;
  adaptiveStrategy: string;
  expectedPerformance: number;
}

@Injectable()
export class AdaptiveService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private contextualBanditService: ContextualBanditService,
    private aiContentService: AiContentService,
    private curriculumService: CurriculumService,
  ) {}

  async generateAdaptiveQuiz(request: AdaptiveQuizRequest): Promise<AdaptiveQuizResponse> {
    // Get user context for adaptive algorithm
    const userContext = await this.buildUserContext(request.userId, request.sessionContext);
    
    // Get optimal difficulty using contextual bandit
    const difficultyResult = await this.contextualBanditService.selectOptimalDifficulty(
      request.userId,
      request.topicId,
      userContext
    );

    // Get difficulty range for question selection
    const difficultyRange = await this.contextualBanditService.getPersonalizedDifficultyRange(
      request.userId,
      request.topicId,
      userContext
    );

    // Select base questions from curriculum
    const baseQuestions = await this.curriculumService.getRandomQuestions(
      request.topicId,
      3, // Start with 3 base questions
      difficultyRange
    );

    // Generate additional AI questions if needed
    const topic = await this.curriculumService.getTopicDetails(request.topicId);
    const aiQuestions = await this.generateAIQuestions(topic, userContext, difficultyResult.selectedDifficulty, 2);

    // Combine and order questions by difficulty progression
    const allQuestions = [...baseQuestions, ...aiQuestions];
    const orderedQuestions = this.createDifficultyProgression(allQuestions, difficultyResult.selectedDifficulty);

    return {
      questions: orderedQuestions,
      difficultyProgression: orderedQuestions.map(q => q.difficulty_level),
      personalizedHints: userContext.currentMastery < 0.6, // Enable hints for struggling students
      adaptiveStrategy: difficultyResult.reasoning,
      expectedPerformance: difficultyResult.confidence,
    };
  }

  async updateLearningModel(
    userId: string,
    topicId: string,
    questionId: string,
    response: {
      isCorrect: boolean;
      timeSpent: number;
      hintsUsed: number;
      difficultyLevel: number;
      confidenceLevel?: number;
    }
  ): Promise<{
    masteryUpdate: any;
    nextDifficultyRecommendation: number;
    performanceInsights: any;
  }> {
    // Calculate reward for contextual bandit
    const reward = this.calculateReward(response);
    
    // Get user context
    const userContext = await this.buildUserContext(userId);
    
    // Update contextual bandit model
    await this.contextualBanditService.updateBanditArm(
      userId,
      topicId,
      response.difficultyLevel,
      reward,
      userContext
    );

    // Update mastery model
    const masteryUpdate = await this.curriculumService.updateTopicMastery(userId, topicId, {
      correct: response.isCorrect,
      timeSpent: response.timeSpent,
      difficultyLevel: response.difficultyLevel,
    });

    // Get updated difficulty recommendation
    const newDifficultyResult = await this.contextualBanditService.selectOptimalDifficulty(
      userId,
      topicId,
      userContext
    );

    // Analyze performance patterns
    const performanceInsights = await this.contextualBanditService.analyzePerformancePattern(userId, topicId);

    return {
      masteryUpdate,
      nextDifficultyRecommendation: newDifficultyResult.selectedDifficulty,
      performanceInsights,
    };
  }

  async getPersonalizedLearningPath(userId: string): Promise<{
    recommendedTopics: any[];
    learningGoals: string[];
    adaptiveInsights: any;
    nextBestActions: string[];
  }> {
    // Get user's current progress
    const userProgress = await this.curriculumService.getUserTopicMastery(userId);
    const userStats = await this.getUserLearningStats(userId);

    // Identify weak areas
    const weakAreas = userProgress
      .filter(p => p.mastery_score < 0.6)
      .map(p => p.topics?.name)
      .filter(Boolean);

    // Get AI-generated learning path
    const aiPath = await this.aiContentService.generateAdaptiveLearningPath(
      userId,
      userProgress,
      weakAreas,
      userStats.gradeLevel
    );

    // Get next recommended topics based on mastery progression
    const recommendedTopics = await this.getNextTopicRecommendations(userId, userProgress);

    // Generate adaptive insights
    const adaptiveInsights = await this.generateAdaptiveInsights(userId, userProgress);

    return {
      recommendedTopics,
      learningGoals: aiPath.focusAreas,
      adaptiveInsights,
      nextBestActions: aiPath.suggestedActivities,
    };
  }

  async generatePersonalizedFeedback(
    userId: string,
    questionId: string,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<string> {
    // Get question details
    const { data: question } = await this.supabase
      .from('questions')
      .select('*, topics(name)')
      .eq('id', questionId)
      .single();

    if (!question) return isCorrect ? 'Great job!' : 'Keep trying!';

    // Get user performance context
    const userStats = await this.getUserLearningStats(userId);
    const recentAccuracy = await this.getRecentAccuracy(userId);

    return this.aiContentService.generatePersonalizedFeedback(
      isCorrect,
      question.topics?.name || 'this topic',
      {
        accuracy: recentAccuracy,
        streak: userStats.currentStreak,
      },
      timeSpent
    );
  }

  private async buildUserContext(userId: string, sessionContext?: any): Promise<any> {
    // Get user profile and stats
    const { data: user } = await this.supabase
      .from('users')
      .select(`
        *,
        user_stats(*),
        user_profiles(*)
      `)
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Fix: Handle user_stats as array or single object
    const userStats = Array.isArray(user.user_stats) ? user.user_stats[0] : user.user_stats;
    const userProfiles = Array.isArray(user.user_profiles) ? user.user_profiles[0] : user.user_profiles;

    // Calculate engagement level based on recent activity
    const engagementLevel = await this.calculateEngagementLevel(userId);
    
    // Get recent accuracy
    const recentAccuracy = await this.getRecentAccuracy(userId);

    return {
      userId,
      gradeLevel: user.grade || 5,
      currentMastery: 0.5, // Will be updated per topic
      recentAccuracy,
      engagementLevel,
      timeOfDay: sessionContext?.timeOfDay || this.getTimeOfDay(),
      sessionLength: sessionContext?.sessionLength || 15,
      streakCount: userStats?.current_streak || 0,
    };
  }

  private async generateAIQuestions(topic: any, userContext: any, targetDifficulty: number, count: number): Promise<any[]> {
    const questions = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const aiQuestion = await this.aiContentService.generateQuestion({
          topic: topic.name,
          gradeLevel: userContext.gradeLevel,
          difficulty: targetDifficulty + (i * 0.1 - 0.05), // Slight variation
          questionType: 'multiple_choice',
          learningObjectives: topic.learning_objectives || [],
          userMasteryLevel: this.getMasteryLabel(userContext.currentMastery),
        });

        questions.push({
          ...aiQuestion,
          id: `ai_${Date.now()}_${i}`,
          topic_id: topic.id,
          ai_generated: true,
        });
      } catch (error) {
        console.error('Failed to generate AI question:', error);
      }
    }

    return questions;
  }

  private createDifficultyProgression(questions: any[], targetDifficulty: number): any[] {
    // Sort questions to create optimal difficulty progression
    const sorted = [...questions].sort((a, b) => a.difficulty_level - b.difficulty_level);
    
    // Reorder to start easier and build up to target
    const progression = [];
    const midPoint = Math.floor(sorted.length / 2);
    
    // Start with easier questions
    progression.push(...sorted.slice(0, midPoint));
    // Add harder questions
    progression.push(...sorted.slice(midPoint));
    
    return progression;
  }

  private calculateReward(response: {
    isCorrect: boolean;
    timeSpent: number;
    hintsUsed: number;
    difficultyLevel: number;
    confidenceLevel?: number;
  }): number {
    let reward = 0;

    // Base reward for correctness
    if (response.isCorrect) {
      reward += 0.6;
      
      // Bonus for difficulty
      reward += response.difficultyLevel * 0.2;
      
      // Time bonus (if answered quickly relative to difficulty)
      const expectedTime = 30 + (response.difficultyLevel * 30);
      if (response.timeSpent < expectedTime) {
        reward += 0.1;
      }
      
      // Penalty for using too many hints
      reward -= response.hintsUsed * 0.05;
    } else {
      // Small reward for attempting
      reward += 0.1;
      
      // Engagement reward (if they spent reasonable time)
      if (response.timeSpent > 10) {
        reward += 0.1;
      }
    }

    // Confidence bonus
    if (response.confidenceLevel && response.confidenceLevel >= 4) {
      reward += 0.05;
    }

    return Math.max(0, Math.min(1, reward));
  }

  private async getUserLearningStats(userId: string): Promise<any> {
    const { data } = await this.supabase
      .from('users')
      .select(`
        grade,
        user_stats(
          current_streak,
          total_xp,
          level
        )
      `)
      .eq('id', userId)
      .single();

    // Fix: Access the first element of user_stats array, or provide defaults
    const userStats = Array.isArray(data?.user_stats) ? data.user_stats[0] : data?.user_stats;

    return {
      gradeLevel: data?.grade || 5,
      currentStreak: userStats?.current_streak || 0,
      totalXP: userStats?.total_xp || 0,
      level: userStats?.level || 1,
    };
  }

  private async getRecentAccuracy(userId: string): Promise<number> {
    const { data } = await this.supabase
      .from('question_responses')
      .select('is_correct')
      .eq('user_id', userId)
      .order('answered_at', { ascending: false })
      .limit(10);

    if (!data || data.length === 0) return 0.5;

    const correct = data.filter(r => r.is_correct).length;
    return correct / data.length;
  }

  private async calculateEngagementLevel(userId: string): Promise<number> {
    // Get recent session data
    const { data } = await this.supabase
      .from('quiz_sessions')
      .select('completion_rate, total_time')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(5);

    if (!data || data.length === 0) return 0.5;

    const avgCompletionRate = data.reduce((sum, s) => sum + s.completion_rate, 0) / data.length;
    const avgSessionTime = data.reduce((sum, s) => sum + s.total_time, 0) / data.length;

    // Normalize to 0-1 scale
    const completionScore = Math.min(1, avgCompletionRate);
    const timeScore = Math.min(1, avgSessionTime / 600); // 10 minutes = full engagement

    return (completionScore + timeScore) / 2;
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private getMasteryLabel(masteryScore: number): string {
    if (masteryScore >= 0.8) return 'advanced';
    if (masteryScore >= 0.6) return 'proficient';
    if (masteryScore >= 0.4) return 'developing';
    return 'novice';
  }

  private async getNextTopicRecommendations(userId: string, userProgress: any[]): Promise<any[]> {
    // Get user's grade
    const { data: user } = await this.supabase
      .from('users')
      .select('grade')
      .eq('id', userId)
      .single();

    const userGrade = user?.grade || 5;

    // Get topics for user's grade that haven't been mastered
    const { data: allTopics } = await this.supabase
      .from('topics')
      .select(`
        *,
        subjects(name, color_hex, icon)
      `)
      .eq('grade_level', userGrade)
      .eq('is_active', true)
      .order('sort_order');

    if (!allTopics) return [];

    // Filter out mastered topics and prioritize based on prerequisites
    const masteredTopicIds = userProgress
      .filter(p => p.mastery_score >= 0.8)
      .map(p => p.topic_id);

    const unmastered = allTopics.filter(topic => !masteredTopicIds.includes(topic.id));

    // Simple recommendation: return first 3 unmastered topics
    return unmastered.slice(0, 3);
  }

  private async generateAdaptiveInsights(userId: string, userProgress: any[]): Promise<any> {
    const totalTopics = userProgress.length;
    const masteredTopics = userProgress.filter(p => p.mastery_score >= 0.8).length;
    const masteryPercentage = totalTopics > 0 ? (masteredTopics / totalTopics) * 100 : 0;
    const strugglingTopics = userProgress.filter(p => p.mastery_score < 0.4).length;

    return {
      masteredTopics,
      strugglingTopics,
      masteryPercentage,
      improvementRate: await this.calculateImprovementRate(userId),
      strongAreas: userProgress
        .filter(p => p.mastery_score >= 0.8)
        .map(p => p.topics?.name)
        .filter(Boolean)
        .slice(0, 3),
      focusAreas: userProgress
        .filter(p => p.mastery_score < 0.6)
        .map(p => p.topics?.name)
        .filter(Boolean)
        .slice(0, 3),
    };
  }

  private async calculateImprovementRate(userId: string): Promise<number> {
    // Get mastery updates from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data } = await this.supabase
      .from('user_topic_mastery')
      .select('mastery_score, updated_at')
      .eq('user_id', userId)
      .gte('updated_at', sevenDaysAgo.toISOString())
      .order('updated_at');

    if (!data || data.length < 2) return 0;
    
    // Calculate trend
    const first = data[0].mastery_score;
    const last = data[data.length - 1].mastery_score;
    
    return ((last - first) / data.length) * 100; // Percentage improvement per update
  }
}