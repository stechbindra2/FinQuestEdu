import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

interface GenerateQuestionRequest {
  topic: string;
  gradeLevel: number;
  difficulty: number; // 0.0 - 1.0
  questionType: 'multiple_choice' | 'true_false' | 'scenario' | 'drag_drop';
  learningObjectives: string[];
  userMasteryLevel?: string;
}

interface GeneratedQuestion {
  question_text: string;
  question_type: string;
  options?: any;
  correct_answer: any;
  explanation: string;
  difficulty_level: number;
  hints: string[];
  estimated_time: number;
}

@Injectable()
export class AiContentService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('AZURE_OPENAI_API_KEY'),
      baseURL: `${this.configService.get<string>('AZURE_OPENAI_ENDPOINT')}/openai/deployments/${this.configService.get<string>('AZURE_OPENAI_MODEL')}`,
      defaultQuery: { 'api-version': this.configService.get<string>('AZURE_OPENAI_API_VERSION') },
      defaultHeaders: {
        'api-key': this.configService.get<string>('AZURE_OPENAI_API_KEY'),
      },
    });
  }

  async generateQuestion(request: GenerateQuestionRequest): Promise<GeneratedQuestion> {
    const prompt = this.buildQuestionPrompt(request);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('AZURE_OPENAI_MODEL') || 'gpt-4o-2',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content creator specializing in personal finance education for children ages 8-13. Create engaging, age-appropriate questions that teach financial literacy concepts.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from AI');
      }

      return this.parseGeneratedQuestion(content, request);
    } catch (error) {
      console.error('AI content generation failed:', error);
      throw new Error('Failed to generate question content');
    }
  }

  async generateHint(questionText: string, correctAnswer: string, userMasteryLevel: string): Promise<string> {
    const prompt = `
Generate a helpful hint for this personal finance question without giving away the answer:

Question: ${questionText}
Correct Answer: ${correctAnswer}
Student Level: ${userMasteryLevel}

Provide a hint that guides the student toward the correct thinking without revealing the answer directly. Make it encouraging and age-appropriate for grades 3-7.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('AZURE_OPENAI_MODEL') || 'gpt-4o-2',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful tutor providing hints to students learning personal finance.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 150,
      });

      return response.choices[0]?.message?.content || 'Think about what you know about this topic and try again!';
    } catch (error) {
      console.error('Hint generation failed:', error);
      return 'Think carefully about what you\'ve learned about this topic!';
    }
  }

  async generatePersonalizedFeedback(
    isCorrect: boolean,
    questionTopic: string,
    userPerformance: { accuracy: number; streak: number },
    timeSpent: number
  ): Promise<string> {
    const prompt = `
Generate personalized feedback for a student who ${isCorrect ? 'correctly' : 'incorrectly'} answered a question about ${questionTopic}.

Student Performance:
- Overall accuracy: ${Math.round(userPerformance.accuracy * 100)}%
- Current streak: ${userPerformance.streak}
- Time spent: ${timeSpent} seconds

Make the feedback:
- Encouraging and positive
- Age-appropriate for grades 3-7
- Specific to personal finance learning
- Brief (1-2 sentences)
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('AZURE_OPENAI_MODEL') || 'gpt-4o-2',
        messages: [
          {
            role: 'system',
            content: 'You are an encouraging teacher providing personalized feedback to young students learning personal finance.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      return response.choices[0]?.message?.content || (isCorrect ? 'Great job!' : 'Keep trying, you\'re learning!');
    } catch (error) {
      console.error('Feedback generation failed:', error);
      return isCorrect ? 'Excellent work!' : 'Good effort! Keep practicing!';
    }
  }

  async generateAdaptiveLearningPath(
    userId: string,
    currentMastery: any[],
    weakAreas: string[],
    gradeLevel: number
  ): Promise<{
    recommendedTopics: string[];
    focusAreas: string[];
    suggestedActivities: string[];
  }> {
    const prompt = `
Analyze this student's learning progress and recommend a personalized learning path:

Grade Level: ${gradeLevel}
Current Mastery: ${JSON.stringify(currentMastery.slice(0, 5))} // Show first 5 topics
Weak Areas: ${weakAreas.join(', ')}

Provide recommendations for:
1. Next 3 topics to focus on
2. 2-3 specific areas that need attention
3. 3 engaging activities to improve understanding

Format as JSON with keys: recommendedTopics, focusAreas, suggestedActivities
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('AZURE_OPENAI_MODEL') || 'gpt-4o-2',
        messages: [
          {
            role: 'system',
            content: 'You are an AI learning advisor specializing in personalized education paths for financial literacy.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content;
      try {
        return JSON.parse(content || '{}');
      } catch {
        return {
          recommendedTopics: ['Review basic concepts', 'Practice with easier questions'],
          focusAreas: ['Foundation building'],
          suggestedActivities: ['Take practice quizzes', 'Review lesson materials']
        };
      }
    } catch (error) {
      console.error('Learning path generation failed:', error);
      return {
        recommendedTopics: ['Continue current studies'],
        focusAreas: ['Regular practice'],
        suggestedActivities: ['Daily practice sessions']
      };
    }
  }

  private buildQuestionPrompt(request: GenerateQuestionRequest): string {
    const difficultyLabels = {
      0.2: 'very easy',
      0.4: 'easy', 
      0.6: 'medium',
      0.8: 'hard',
      1.0: 'very hard'
    };

    const difficultyLabel = difficultyLabels[Math.round(request.difficulty * 5) / 5] || 'medium';

    return `
Create a ${difficultyLabel} ${request.questionType} question about "${request.topic}" for Grade ${request.gradeLevel} students.

Learning Objectives: ${request.learningObjectives.join(', ')}
Difficulty Level: ${request.difficulty} (0.0-1.0 scale)
${request.userMasteryLevel ? `Student Mastery Level: ${request.userMasteryLevel}` : ''}

Requirements:
- Age-appropriate language for ${request.gradeLevel} graders
- Engaging, real-world scenarios
- Clear, unambiguous correct answer
- Educational explanation
- 2-3 helpful hints
- Estimated completion time

Format as JSON:
{
  "question_text": "Question here",
  "question_type": "${request.questionType}",
  ${request.questionType === 'multiple_choice' ? '"options": {"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"},' : ''}
  "correct_answer": {"answer": "correct_option", "explanation": "why this is correct"},
  "explanation": "Educational explanation of the concept",
  "difficulty_level": ${request.difficulty},
  "hints": ["hint1", "hint2", "hint3"],
  "estimated_time": 30
}
    `;
  }

  private parseGeneratedQuestion(content: string, request: GenerateQuestionRequest): GeneratedQuestion {
    try {
      const parsed = JSON.parse(content);
      return {
        question_text: parsed.question_text,
        question_type: request.questionType,
        options: parsed.options || null,
        correct_answer: parsed.correct_answer,
        explanation: parsed.explanation,
        difficulty_level: request.difficulty,
        hints: parsed.hints || [],
        estimated_time: parsed.estimated_time || 30,
      };
    } catch (error) {
      console.error('Failed to parse generated question:', error);
      throw new Error('Invalid question format generated');
    }
  }
}
