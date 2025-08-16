import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/database.module';

interface UserContext {
  userId: string;
  gradeLevel: number;
  currentMastery: number;
  recentAccuracy: number;
  engagementLevel: number;
  timeOfDay: string;
  sessionLength: number;
  streakCount: number;
}

interface BanditArm {
  difficultyLevel: number;
  rewardSum: number;
  playCount: number;
  confidenceBound: number;
}

interface AdaptiveDifficultyResult {
  selectedDifficulty: number;
  confidence: number;
  reasoning: string;
  expectedReward: number;
}

@Injectable()
export class ContextualBanditService {
  private readonly explorationRate = 0.1; // 10% exploration
  private readonly confidenceConstant = 2.0; // UCB confidence parameter

  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async selectOptimalDifficulty(
    userId: string,
    topicId: string,
    context: UserContext
  ): Promise<AdaptiveDifficultyResult> {
    // Get existing bandit arms for this user-topic combination
    const arms = await this.getBanditArms(userId, topicId);
    
    // If no arms exist, initialize them
    if (arms.length === 0) {
      await this.initializeBanditArms(userId, topicId);
      return this.getDefaultDifficulty(context);
    }

    // Calculate UCB (Upper Confidence Bound) for each arm
    const totalPlays = arms.reduce((sum, arm) => sum + arm.playCount, 0);
    const armScores = arms.map(arm => {
      if (arm.playCount === 0) {
        return { arm, score: Infinity }; // Explore unplayed arms first
      }

      const averageReward = arm.rewardSum / arm.playCount;
      const confidence = Math.sqrt((this.confidenceConstant * Math.log(totalPlays)) / arm.playCount);
      const contextualBonus = this.calculateContextualBonus(arm.difficultyLevel, context);
      
      return {
        arm,
        score: averageReward + confidence + contextualBonus
      };
    });

    // Select arm with highest UCB score (exploration vs exploitation)
    const shouldExplore = Math.random() < this.explorationRate;
    const selectedArm = shouldExplore 
      ? this.selectRandomArm(armScores)
      : armScores.reduce((best, current) => current.score > best.score ? current : best);

    const confidence = selectedArm.arm.playCount > 0 
      ? selectedArm.arm.rewardSum / selectedArm.arm.playCount 
      : 0.5;

    return {
      selectedDifficulty: selectedArm.arm.difficultyLevel,
      confidence,
      reasoning: shouldExplore ? 'exploration' : 'exploitation',
      expectedReward: selectedArm.score,
    };
  }

  async updateBanditArm(
    userId: string,
    topicId: string,
    difficultyLevel: number,
    reward: number,
    context: UserContext
  ): Promise<void> {
    // Calculate contextual reward adjustment
    const adjustedReward = this.adjustRewardForContext(reward, context);

    // Get current arm data first
    const { data: currentArm } = await this.supabase
      .from('contextual_bandit_arms')
      .select('reward_sum, play_count')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .eq('difficulty_level', difficultyLevel)
      .single();

    // Calculate new values
    const newRewardSum = (currentArm?.reward_sum || 0) + adjustedReward;
    const newPlayCount = (currentArm?.play_count || 0) + 1;

    // Update the bandit arm
    const { error } = await this.supabase
      .from('contextual_bandit_arms')
      .upsert({
        user_id: userId,
        topic_id: topicId,
        difficulty_level: difficultyLevel,
        reward_sum: newRewardSum,
        play_count: newPlayCount,
        last_updated: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to update bandit arm:', error);
    }

    // Recalculate confidence bounds for all arms
    await this.updateConfidenceBounds(userId, topicId);
  }

  async getPersonalizedDifficultyRange(
    userId: string,
    topicId: string,
    context: UserContext
  ): Promise<{ min: number; max: number; target: number }> {
    const result = await this.selectOptimalDifficulty(userId, topicId, context);
    
    // Create range around selected difficulty
    const baseRange = 0.15;
    const masteryAdjustment = (context.currentMastery - 0.5) * 0.1;
    const range = baseRange + Math.abs(masteryAdjustment);

    return {
      min: Math.max(0.1, result.selectedDifficulty - range),
      max: Math.min(0.9, result.selectedDifficulty + range),
      target: result.selectedDifficulty,
    };
  }

  async analyzePerformancePattern(userId: string, topicId: string): Promise<{
    optimalDifficulty: number;
    learningVelocity: number;
    engagementTrend: string;
    recommendations: string[];
  }> {
    // Get recent performance data
    const { data: recentSessions } = await this.supabase
      .from('question_responses')
      .select(`
        *,
        quiz_sessions(topic_id, session_type)
      `)
      .eq('user_id', userId)
      .eq('quiz_sessions.topic_id', topicId)
      .order('answered_at', { ascending: false })
      .limit(20);

    if (!recentSessions || recentSessions.length === 0) {
      return {
        optimalDifficulty: 0.5,
        learningVelocity: 0,
        engagementTrend: 'unknown',
        recommendations: ['Complete more questions to analyze patterns'],
      };
    }

    // Analyze performance trends
    const accuracyTrend = this.calculateTrend(recentSessions.map(s => s.is_correct ? 1 : 0));
    const timeTrend = this.calculateTrend(recentSessions.map(s => s.time_spent));
    const difficultyPerformance = this.analyzeDifficultyPerformance(recentSessions);

    // Find optimal difficulty (where accuracy is ~70-80%)
    const optimalDifficulty = this.findOptimalDifficulty(difficultyPerformance);

    // Calculate learning velocity (improvement rate)
    const learningVelocity = this.calculateLearningVelocity(recentSessions);

    // Determine engagement trend
    const engagementTrend = this.analyzeEngagementTrend(recentSessions);

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      accuracyTrend,
      timeTrend,
      learningVelocity,
      engagementTrend,
      optimalDifficulty,
    });

    return {
      optimalDifficulty,
      learningVelocity,
      engagementTrend,
      recommendations,
    };
  }

  private async getBanditArms(userId: string, topicId: string): Promise<BanditArm[]> {
    const { data, error } = await this.supabase
      .from('contextual_bandit_arms')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .order('difficulty_level');

    if (error) {
      console.error('Failed to get bandit arms:', error);
      return [];
    }

    return data || [];
  }

  private async initializeBanditArms(userId: string, topicId: string): Promise<void> {
    // Initialize 5 difficulty levels: 0.2, 0.4, 0.6, 0.8, 1.0
    const difficulties = [0.2, 0.4, 0.6, 0.8, 1.0];
    
    const arms = difficulties.map(difficulty => ({
      user_id: userId,
      topic_id: topicId,
      difficulty_level: difficulty,
      reward_sum: 0,
      play_count: 0,
      confidence_bound: 1.0,
    }));

    const { error } = await this.supabase
      .from('contextual_bandit_arms')
      .insert(arms);

    if (error) {
      console.error('Failed to initialize bandit arms:', error);
    }
  }

  private calculateContextualBonus(difficultyLevel: number, context: UserContext): number {
    let bonus = 0;

    // Mastery-based bonus
    const masteryDiff = Math.abs(difficultyLevel - context.currentMastery);
    bonus += (1 - masteryDiff) * 0.1; // Prefer difficulties close to mastery level

    // Engagement-based bonus
    if (context.engagementLevel < 0.5 && difficultyLevel < 0.6) {
      bonus += 0.05; // Easier questions when engagement is low
    }

    // Streak-based bonus
    if (context.streakCount > 3 && difficultyLevel > 0.6) {
      bonus += 0.03; // Harder questions when on a streak
    }

    // Time of day adjustment
    if (context.timeOfDay === 'morning' && difficultyLevel > 0.7) {
      bonus += 0.02; // Harder questions in the morning
    }

    return bonus;
  }

  private adjustRewardForContext(baseReward: number, context: UserContext): number {
    let adjustedReward = baseReward;

    // Time-based adjustment
    if (context.sessionLength > 20) {
      adjustedReward *= 0.9; // Slight penalty for very long sessions
    }

    // Engagement adjustment
    adjustedReward *= (0.5 + context.engagementLevel * 0.5);

    return Math.max(0, Math.min(1, adjustedReward));
  }

  private async updateConfidenceBounds(userId: string, topicId: string): Promise<void> {
    const arms = await this.getBanditArms(userId, topicId);
    const totalPlays = arms.reduce((sum, arm) => sum + arm.playCount, 0);

    const updates = arms.map(arm => {
      const confidence = arm.playCount > 0 
        ? Math.sqrt((this.confidenceConstant * Math.log(totalPlays)) / arm.playCount)
        : 1.0;

      return {
        user_id: userId,
        topic_id: topicId,
        difficulty_level: arm.difficultyLevel,
        confidence_bound: confidence,
      };
    });

    const { error } = await this.supabase
      .from('contextual_bandit_arms')
      .upsert(updates, { onConflict: 'user_id,topic_id,difficulty_level' });

    if (error) {
      console.error('Failed to update confidence bounds:', error);
    }
  }

  private getDefaultDifficulty(context: UserContext): AdaptiveDifficultyResult {
    // Start with grade-appropriate difficulty
    const baseDifficulty = Math.max(0.2, Math.min(0.8, (context.gradeLevel - 2) * 0.15));
    
    // Adjust based on mastery
    const masteryAdjustment = (context.currentMastery - 0.5) * 0.2;
    const selectedDifficulty = Math.max(0.1, Math.min(0.9, baseDifficulty + masteryAdjustment));

    return {
      selectedDifficulty,
      confidence: 0.5,
      reasoning: 'default_initialization',
      expectedReward: 0.5,
    };
  }

  private selectRandomArm(armScores: { arm: BanditArm; score: number }[]): { arm: BanditArm; score: number } {
    return armScores[Math.floor(Math.random() * armScores.length)];
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = values.reduce((a, b) => a + b) / n;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (values[i] - meanY), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private analyzeDifficultyPerformance(sessions: any[]): Map<number, { accuracy: number; count: number }> {
    const performanceMap = new Map();
    
    sessions.forEach(session => {
      const difficulty = Math.round(session.difficulty_at_attempt * 10) / 10;
      const current = performanceMap.get(difficulty) || { correct: 0, total: 0 };
      
      performanceMap.set(difficulty, {
        correct: current.correct + (session.is_correct ? 1 : 0),
        total: current.total + 1,
      });
    });

    const result = new Map();
    performanceMap.forEach((value, key) => {
      result.set(key, {
        accuracy: value.total > 0 ? value.correct / value.total : 0,
        count: value.total,
      });
    });

    return result;
  }

  private findOptimalDifficulty(performanceMap: Map<number, { accuracy: number; count: number }>): number {
    let optimalDifficulty = 0.5;
    let bestScore = 0;

    performanceMap.forEach((performance, difficulty) => {
      if (performance.count >= 3) { // Need sufficient data
        // Optimal accuracy is around 70-80%
        const targetAccuracy = 0.75;
        const accuracyScore = 1 - Math.abs(performance.accuracy - targetAccuracy);
        const difficultyScore = difficulty; // Prefer higher difficulty when possible
        
        const combinedScore = accuracyScore * 0.7 + difficultyScore * 0.3;
        
        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          optimalDifficulty = difficulty;
        }
      }
    });

    return optimalDifficulty;
  }

  private calculateLearningVelocity(sessions: any[]): number {
    if (sessions.length < 5) return 0;

    // Split sessions into two halves and compare accuracy
    const midPoint = Math.floor(sessions.length / 2);
    const recentSessions = sessions.slice(0, midPoint);
    const olderSessions = sessions.slice(midPoint);

    const recentAccuracy = recentSessions.reduce((sum, s) => sum + (s.is_correct ? 1 : 0), 0) / recentSessions.length;
    const olderAccuracy = olderSessions.reduce((sum, s) => sum + (s.is_correct ? 1 : 0), 0) / olderSessions.length;

    return recentAccuracy - olderAccuracy;
  }

  private analyzeEngagementTrend(sessions: any[]): string {
    if (sessions.length < 3) return 'insufficient_data';

    const avgTimeSpent = sessions.reduce((sum, s) => sum + s.time_spent, 0) / sessions.length;
    const recentAvgTime = sessions.slice(0, Math.ceil(sessions.length / 3))
      .reduce((sum, s) => sum + s.time_spent, 0) / Math.ceil(sessions.length / 3);

    const hintsUsed = sessions.reduce((sum, s) => sum + (s.hints_used || 0), 0) / sessions.length;

    if (recentAvgTime < avgTimeSpent * 0.7 && hintsUsed < 0.5) {
      return 'declining';
    } else if (recentAvgTime > avgTimeSpent * 1.2) {
      return 'increasing';
    } else {
      return 'stable';
    }
  }

  private generateRecommendations(analysis: {
    accuracyTrend: number;
    timeTrend: number;
    learningVelocity: number;
    engagementTrend: string;
    optimalDifficulty: number;
  }): string[] {
    const recommendations = [];

    if (analysis.learningVelocity > 0.1) {
      recommendations.push('You\'re improving fast! Try slightly harder questions.');
    } else if (analysis.learningVelocity < -0.1) {
      recommendations.push('Take your time with easier questions to build confidence.');
    }

    if (analysis.engagementTrend === 'declining') {
      recommendations.push('Take a short break or try a different topic to stay fresh.');
    }

    if (analysis.accuracyTrend > 0.05) {
      recommendations.push('Great progress! You\'re getting more accurate over time.');
    }

    if (analysis.optimalDifficulty > 0.7) {
      recommendations.push('You\'re ready for challenging questions. Keep pushing yourself!');
    } else if (analysis.optimalDifficulty < 0.4) {
      recommendations.push('Focus on mastering the basics before moving to harder topics.');
    }

    return recommendations.length > 0 ? recommendations : ['Keep practicing to see personalized recommendations!'];
  }
}
