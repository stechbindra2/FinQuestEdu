import { supabase } from '@/lib/supabase/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken()
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ user: any; access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(userData: {
    email: string
    password: string
    full_name: string
    grade?: number
    role?: string
  }) {
    return this.request<{ user: any; access_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  // Curriculum endpoints
  async getSubjects() {
    return this.request<any[]>('/curriculum/subjects')
  }

  async getTopicsByGrade(grade: number) {
    return this.request<any[]>(`/curriculum/topics/grade/${grade}`)
  }

  async getTopicDetails(topicId: string) {
    return this.request<any>(`/curriculum/topics/${topicId}`)
  }

  async getUserProgress() {
    return this.request<any>('/curriculum/progress/overview')
  }

  async getUserMastery(topicId?: string) {
    const endpoint = topicId ? `/curriculum/mastery/${topicId}` : '/curriculum/mastery'
    return this.request<any>(endpoint)
  }

  // Quiz endpoints
  async startQuiz(data: {
    topic_id: string
    question_count?: number
    session_type?: string
  }) {
    return this.request<any>('/quiz/start', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async submitAnswer(data: {
    session_id: string
    question_id: string
    user_answer: any
    time_spent: number
    hints_used?: number
    confidence_level?: number
  }) {
    return this.request<any>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async completeQuiz(sessionId: string) {
    return this.request<any>(`/quiz/complete/${sessionId}`, {
      method: 'POST',
    })
  }

  async getQuizHistory() {
    return this.request<any[]>('/quiz/history')
  }

  // Gamification endpoints
  async getUserStats() {
    return this.request<any>('/gamification/stats')
  }

  async getUserBadges() {
    return this.request<any[]>('/gamification/badges')
  }

  async getLeaderboard(type: 'xp' | 'streak' | 'weekly' = 'xp', grade?: number) {
    const params = new URLSearchParams()
    if (grade) params.append('grade', grade.toString())
    
    return this.request<any[]>(`/gamification/leaderboard/${type}?${params}`)
  }

  async getMotivation() {
    return this.request<any>('/gamification/motivation')
  }

  // Adaptive learning endpoints
  async generateAdaptiveQuiz(data: {
    userId: string
    topicId: string
    sessionContext?: any
  }) {
    return this.request<any>('/adaptive/quiz/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getLearningPath() {
    return this.request<any>('/adaptive/learning-path')
  }

  async getPersonalizedFeedback(questionId: string, isCorrect: boolean, timeSpent: number) {
    return this.request<string>('/adaptive/feedback', {
      method: 'POST',
      body: JSON.stringify({ questionId, isCorrect, timeSpent }),
    })
  }
}

export const apiClient = new ApiClient()
