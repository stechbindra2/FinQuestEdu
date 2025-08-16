'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { Navigation } from '@/components/ui/navigation'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Star, 
  Clock,
  Target,
  TrendingUp,
  Zap,
  RotateCcw,
  Home,
  BookOpen,
  Award,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

export default function QuizResultsPage({ params }: { params: { sessionId: string } }) {
  // Define badge type
  interface Badge {
    id: string;
    name: string;
  }

  // Mock data - would come from API in real implementation
  const quizResults = {
    session: {
      id: params.sessionId,
      topic_id: '660e8400-e29b-41d4-a716-446655440001',
      correct_answers: 4,
      total_questions: 5,
      total_time: 180, // 3 minutes
      completion_rate: 100,
      completed_at: new Date().toISOString(),
    },
    performance: {
      accuracy: 80,
      total_questions: 5,
      correct_answers: 4,
      total_time: 180,
      average_time_per_question: 36,
      completion_rate: 100,
    },
    responses: [
      { question_id: '1', is_correct: true, time_spent: 25, hints_used: 0 },
      { question_id: '2', is_correct: true, time_spent: 30, hints_used: 1 },
      { question_id: '3', is_correct: false, time_spent: 45, hints_used: 2 },
      { question_id: '4', is_correct: true, time_spent: 40, hints_used: 0 },
      { question_id: '5', is_correct: true, time_spent: 40, hints_used: 1 },
    ],
    xpEarned: 85,
    levelUp: false,
    newBadges: [] as Badge[],
    masteryUpdate: {
      previous_score: 0.65,
      new_score: 0.75,
      mastery_level: 'proficient'
    }
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 90) return { text: 'Excellent!', color: 'bg-green-500', icon: '🌟' }
    if (percentage >= 80) return { text: 'Great Job!', color: 'bg-blue-500', icon: '⭐' }
    if (percentage >= 70) return { text: 'Good Work!', color: 'bg-yellow-500', icon: '👍' }
    return { text: 'Keep Trying!', color: 'bg-red-500', icon: '💪' }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const badge = getPerformanceBadge(quizResults.performance.accuracy)

  return (
    <div>
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Performance Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
            <span className="text-4xl">{badge.icon}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
          <div className={`inline-block px-4 py-2 ${badge.color} text-white rounded-full font-semibold`}>
            {badge.text}
          </div>
        </motion.div>

        {/* Main Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Performance Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 card"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Performance Summary
            </h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className={`text-3xl font-bold ${getPerformanceColor(quizResults.performance.accuracy)}`}>
                  {quizResults.performance.accuracy}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Accuracy</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {quizResults.performance.correct_answers}/{quizResults.performance.total_questions}
                </div>
                <div className="text-sm text-gray-600 mt-1">Correct</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {formatTime(quizResults.performance.total_time)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Time</div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {quizResults.performance.average_time_per_question}s
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg/Question</div>
              </div>
            </div>

            {/* Question Breakdown */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Question Breakdown</h3>
              <div className="space-y-2">
                {quizResults.responses.map((response, index) => (
                  <motion.div
                    key={response.question_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border-2
                      ${response.is_correct 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      {response.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        Question {index + 1}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{formatTime(response.time_spent)}</span>
                      {response.hints_used > 0 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                          {response.hints_used} hint{response.hints_used > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Rewards & Progress */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* XP Earned */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-gamified-xp" />
                Rewards
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">XP Earned</span>
                  <span className="text-2xl font-bold text-green-600">+{quizResults.xpEarned}</span>
                </div>

                {quizResults.levelUp && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium text-purple-800">Level Up!</span>
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                )}

                {quizResults.newBadges.length > 0 && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-800 mb-2">New Badges!</div>
                    {quizResults.newBadges.map((badge, index) => (
                      <div key={index} className="text-sm text-yellow-700">
                        🏆 {badge.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mastery Progress */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                Topic Mastery
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Previous</span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(quizResults.masteryUpdate.previous_score * 100)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current</span>
                  <span className="font-semibold text-blue-600">
                    {Math.round(quizResults.masteryUpdate.new_score * 100)}%
                  </span>
                </div>

                <div className="xp-bar h-3">
                  <motion.div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full"
                    initial={{ width: `${quizResults.masteryUpdate.previous_score * 100}%` }}
                    animate={{ width: `${quizResults.masteryUpdate.new_score * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>

                <div className="text-center">
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${quizResults.masteryUpdate.mastery_level === 'advanced' ? 'bg-purple-100 text-purple-700' :
                      quizResults.masteryUpdate.mastery_level === 'proficient' ? 'bg-blue-100 text-blue-700' :
                      quizResults.masteryUpdate.mastery_level === 'developing' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'}
                  `}>
                    {quizResults.masteryUpdate.mastery_level.charAt(0).toUpperCase() + 
                     quizResults.masteryUpdate.mastery_level.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                Insights
              </h3>
              
              <div className="space-y-3 text-sm">
                {quizResults.performance.accuracy >= 80 && (
                  <div className="p-3 bg-green-50 rounded-lg text-green-700">
                    🎯 Great accuracy! You're really understanding this topic.
                  </div>
                )}
                
                {quizResults.performance.average_time_per_question < 30 && (
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-700">
                    ⚡ Fast thinker! You answered questions quickly.
                  </div>
                )}
                
                {quizResults.responses.filter(r => r.hints_used === 0).length >= 3 && (
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-700">
                    🧠 Independent learner! You solved most questions without hints.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/learn" className="btn-primary flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Continue Learning</span>
          </Link>
          
          <Link href="/learn/topic/660e8400-e29b-41d4-a716-446655440001" className="btn-secondary flex items-center space-x-2">
            <RotateCcw className="w-4 h-4" />
            <span>Retry Topic</span>
          </Link>
          
          <Link href="/dashboard" className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
