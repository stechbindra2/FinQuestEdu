'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Navigation } from '@/components/ui/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Play, 
  Trophy,
  Target,
  Clock,
  Star,
  ArrowLeft,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useNotification } from '@/components/ui/notification-provider'

export default function TopicDetailPage({ params }: { params: { topicId: string } }) {
  const { profile } = useAuth()
  const router = useRouter()
  const { success, error } = useNotification()

  const { data: topic, isLoading: topicLoading } = useQuery({
    queryKey: ['topic', params.topicId],
    queryFn: () => apiClient.getTopicDetails(params.topicId),
  })

  const { data: mastery } = useQuery({
    queryKey: ['mastery', params.topicId],
    queryFn: () => apiClient.getUserMastery(params.topicId),
  })

  const startQuizMutation = useMutation({
    mutationFn: (quizData: any) => apiClient.startQuiz(quizData),
    onSuccess: (data) => {
      success('Quiz Started!', 'Good luck on your learning adventure!')
      router.push(`/quiz/session/${data.session_id}`)
    },
    onError: (err: any) => {
      error('Failed to start quiz', err.message)
    }
  })

  const handleStartQuiz = (sessionType: string = 'practice') => {
    startQuizMutation.mutate({
      topic_id: params.topicId,
      session_type: sessionType,
      question_count: 5,
    })
  }

  if (topicLoading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!topic) {
    return (
      <div>
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Topic Not Found</h1>
          <Link href="/learn" className="btn-primary">
            Back to Learning Center
          </Link>
        </div>
      </div>
    )
  }

  const isCompleted = mastery?.mastery_score >= 0.8
  const isStarted = mastery && mastery.attempts > 0
  const masteryPercentage = mastery ? Math.round(mastery.mastery_score * 100) : 0
  const subjectColor = topic.subjects?.color_hex || '#3b82f6'

  return (
    <div>
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link 
            href="/learn" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning Center
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Topic Header */}
            <div className="card">
              <div className="flex items-start space-x-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-3xl flex-shrink-0"
                  style={{ backgroundColor: subjectColor }}
                >
                  {topic.subjects?.icon === 'piggy-bank' && '🐷'}
                  {topic.subjects?.icon === 'shopping-cart' && '🛒'}
                  {topic.subjects?.icon === 'building-2' && '🏦'}
                  {topic.subjects?.icon === 'trending-up' && '📈'}
                  {topic.subjects?.icon === 'lightbulb' && '💡'}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: subjectColor }}
                    >
                      {topic.subjects?.name}
                    </span>
                    <span className="text-sm text-gray-500">Grade {topic.grade_level}</span>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{topic.name}</h1>
                  <p className="text-gray-600">{topic.description}</p>
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary-500" />
                Learning Goals
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topic.learning_objectives?.map((objective: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary-600">{index + 1}</span>
                    </div>
                    <p className="text-gray-700">{objective}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Available Questions */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-green-500" />
                Practice Questions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Play className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-900">Practice Mode</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Learn at your own pace with hints and explanations
                  </p>
                  <button
                    onClick={() => handleStartQuiz('practice')}
                    disabled={startQuizMutation.isPending}
                    className="w-full btn-primary text-sm"
                  >
                    {startQuizMutation.isPending ? 'Starting...' : 'Start Practice'}
                  </button>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-gray-900">Adaptive Quiz</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    AI adjusts difficulty based on your performance
                  </p>
                  <button
                    onClick={() => handleStartQuiz('adaptive')}
                    disabled={startQuizMutation.isPending}
                    className="w-full btn-secondary text-sm"
                  >
                    {startQuizMutation.isPending ? 'Starting...' : 'Start Adaptive'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Progress Card */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
              
              {isStarted ? (
                <div className="space-y-4">
                  {/* Mastery Level */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Mastery Level</span>
                      <span className="text-sm font-medium text-gray-900">{masteryPercentage}%</span>
                    </div>
                    <div className="xp-bar h-3">
                      <div 
                        className="h-3 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${masteryPercentage}%`,
                          backgroundColor: subjectColor 
                        }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {mastery?.mastery_level === 'advanced' && '🌟 Advanced'}
                      {mastery?.mastery_level === 'proficient' && '⭐ Proficient'}
                      {mastery?.mastery_level === 'developing' && '📈 Developing'}
                      {mastery?.mastery_level === 'novice' && '🌱 Novice'}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{mastery?.attempts || 0}</p>
                      <p className="text-xs text-gray-600">Attempts</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-success-600">{mastery?.correct_answers || 0}</p>
                      <p className="text-xs text-gray-600">Correct</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isCompleted && (
                    <div className="flex items-center justify-center space-x-2 p-3 bg-success-50 border border-success-200 rounded-lg">
                      <Trophy className="w-5 h-5 text-success-600" />
                      <span className="font-medium text-success-800">Topic Mastered!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Ready to start your learning journey?</p>
                  <button
                    onClick={() => handleStartQuiz('practice')}
                    disabled={startQuizMutation.isPending}
                    className="btn-primary"
                  >
                    Begin Topic
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">~15 minutes to complete</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Difficulty: {Math.round(topic.difficulty_base * 100)}%
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {topic.questions?.length || 0} practice questions
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
