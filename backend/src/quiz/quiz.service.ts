import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/database.module';
import { CurriculumService } from '../curriculum/curriculum.service';
import { UsersService } from '../users/users.service';
import { StartQuizDto, SubmitAnswerDto, QuizSessionDto } from './dto/quiz.dto';

@Injectable()
export class QuizService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private curriculumService: CurriculumService,
    private usersService: UsersService,
  ) {}

  async startQuizSession(userId: string, startQuizDto: StartQuizDto): Promise<QuizSessionDto> {
    const { topic_id, session_type = 'practice', question_count = 5 } = startQuizDto;

    // Create quiz session
    const { data: session, error: sessionError } = await this.supabase
      .from('quiz_sessions')
      .insert({
        user_id: userId,
        topic_id,
        session_type,
        total_questions: question_count,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      throw new BadRequestException(`Failed to create quiz session: ${sessionError.message}`);
    }

    // Get user's current mastery level for adaptive difficulty
    const userMastery = await this.curriculumService.getUserTopicMastery(userId, topic_id);
    const currentMasteryScore = userMastery?.mastery_score || 0.3;

    // Calculate target difficulty based on mastery
    const targetDifficulty = Math.min(0.9, Math.max(0.1, currentMasteryScore + 0.1));

    // Get questions for the session
    const questions = await this.curriculumService.getRandomQuestions(
      topic_id,
      question_count,
      { min: targetDifficulty - 0.2, max: targetDifficulty + 0.2 }
    );

    if (questions.length === 0) {
      throw new NotFoundException('No questions available for this topic');
    }

    return {
      session_id: session.id,
      topic_id,
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        hints: q.hints,
        estimated_time: q.estimated_time,
        difficulty_level: q.difficulty_level,
      })),
      current_question: 0,
      total_questions: questions.length,
      target_difficulty: targetDifficulty,
    };
  }

  async submitAnswer(userId: string, submitAnswerDto: SubmitAnswerDto) {
    const {
      session_id,
      question_id,
      user_answer,
      time_spent,
      hints_used = 0,
      confidence_level,
    } = submitAnswerDto;

    // Verify session belongs to user
    const { data: session, error: sessionError } = await this.supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      throw new NotFoundException('Quiz session not found');
    }

    // Get question details
    const { data: question, error: questionError } = await this.supabase
      .from('questions')
      .select('*')
      .eq('id', question_id)
      .single();

    if (questionError || !question) {
      throw new NotFoundException('Question not found');
    }

    // Check if answer is correct
    const isCorrect = this.checkAnswer(question, user_answer);

    // Calculate XP reward
    const baseXP = 10;
    const difficultyBonus = Math.round(question.difficulty_level * 20);
    const speedBonus = time_spent < question.estimated_time ? 5 : 0;
    const hintPenalty = hints_used * 2;
    const xpEarned = Math.max(5, baseXP + difficultyBonus + speedBonus - hintPenalty);

    // Record response
    const { data: response, error: responseError } = await this.supabase
      .from('question_responses')
      .insert({
        session_id,
        question_id,
        user_id: userId,
        user_answer,
        is_correct: isCorrect,
        time_spent,
        hints_used,
        confidence_level,
        difficulty_at_attempt: question.difficulty_level,
        answered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (responseError) {
      throw new BadRequestException(`Failed to record response: ${responseError.message}`);
    }

    // Update session stats
    await this.updateSessionStats(session_id, isCorrect, time_spent);

    // Update user topic mastery
    await this.curriculumService.updateTopicMastery(userId, session.topic_id, {
      correct: isCorrect,
      timeSpent: time_spent,
      difficultyLevel: question.difficulty_level,
    });

    // Award XP if correct
    let levelUp = false;
    if (isCorrect) {
      const xpResult = await this.usersService.updateXP(userId, xpEarned);
      levelUp = xpResult?.levelUp || false;
    }

    return {
      is_correct: isCorrect,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      xp_earned: isCorrect ? xpEarned : 0,
      level_up: levelUp,
      response_id: response.id,
    };
  }

  async completeQuizSession(userId: string, sessionId: string) {
    // Get session with responses
    const { data: session, error: sessionError } = await this.supabase
      .from('quiz_sessions')
      .select(`
        *,
        question_responses(*)
      `)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      throw new NotFoundException('Quiz session not found');
    }

    const responses = session.question_responses || [];
    const correctAnswers = responses.filter(r => r.is_correct).length;
    const totalTime = responses.reduce((sum, r) => sum + r.time_spent, 0);
    const completionRate = responses.length / session.total_questions;

    // Update session completion
    const { data: completedSession, error: updateError } = await this.supabase
      .from('quiz_sessions')
      .update({
        correct_answers: correctAnswers,
        total_time: totalTime,
        completion_rate: completionRate,
        completed_at: new Date().toISOString(),
        is_completed: true,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      throw new BadRequestException(`Failed to complete session: ${updateError.message}`);
    }

    // Update user stats
    await this.updateUserSessionStats(userId, {
      questionsAnswered: responses.length,
      correctAnswers,
      timeSpent: totalTime,
    });

    // Calculate performance metrics
    const accuracy = responses.length > 0 ? correctAnswers / responses.length : 0;
    const averageTime = responses.length > 0 ? totalTime / responses.length : 0;
    
    return {
      session: completedSession,
      performance: {
        accuracy: Math.round(accuracy * 100),
        total_questions: responses.length,
        correct_answers: correctAnswers,
        total_time: totalTime,
        average_time_per_question: Math.round(averageTime),
        completion_rate: Math.round(completionRate * 100),
      },
      responses: responses.map(r => ({
        question_id: r.question_id,
        is_correct: r.is_correct,
        time_spent: r.time_spent,
        hints_used: r.hints_used,
      })),
    };
  }

  async getUserQuizHistory(userId: string, limit: number = 10) {
    const { data, error } = await this.supabase
      .from('quiz_sessions')
      .select(`
        *,
        topics(
          id,
          name,
          subjects(name, color_hex)
        )
      `)
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new NotFoundException('Failed to fetch quiz history');
    }

    return data;
  }

  private checkAnswer(question: any, userAnswer: any): boolean {
    const correctAnswer = question.correct_answer;
    
    switch (question.question_type) {
      case 'multiple_choice':
        return userAnswer.answer === correctAnswer.answer;
      case 'true_false':
        return userAnswer.answer === correctAnswer.answer;
      case 'fill_blank':
        return userAnswer.answer?.toLowerCase().trim() === correctAnswer.answer?.toLowerCase().trim();
      case 'drag_drop':
        return JSON.stringify(userAnswer.order) === JSON.stringify(correctAnswer.order);
      default:
        return false;
    }
  }

  private async updateSessionStats(sessionId: string, isCorrect: boolean, timeSpent: number) {
    const { data: currentSession } = await this.supabase
      .from('quiz_sessions')
      .select('correct_answers, total_time')
      .eq('id', sessionId)
      .single();

    if (currentSession) {
      await this.supabase
        .from('quiz_sessions')
        .update({
          correct_answers: currentSession.correct_answers + (isCorrect ? 1 : 0),
          total_time: currentSession.total_time + timeSpent,
        })
        .eq('id', sessionId);
    }
  }

  private async updateUserSessionStats(userId: string, stats: {
    questionsAnswered: number;
    correctAnswers: number;
    timeSpent: number;
  }) {
    const { data: currentStats } = await this.supabase
      .from('user_stats')
      .select('total_questions_answered, total_correct_answers, total_time_spent, current_streak')
      .eq('user_id', userId)
      .single();

    if (currentStats) {
      const newStreak = stats.correctAnswers === stats.questionsAnswered ? 
        currentStats.current_streak + stats.correctAnswers : 0;

      await this.supabase
        .from('user_stats')
        .update({
          total_questions_answered: currentStats.total_questions_answered + stats.questionsAnswered,
          total_correct_answers: currentStats.total_correct_answers + stats.correctAnswers,
          total_time_spent: currentStats.total_time_spent + stats.timeSpent,
          current_streak: newStreak,
          longest_streak: Math.max(currentStats.current_streak, newStreak),
        })
        .eq('user_id', userId);
    }
  }
}
