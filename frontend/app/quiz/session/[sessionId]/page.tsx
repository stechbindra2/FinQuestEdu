'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  HelpCircle, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Lightbulb,
  Zap,
  Star
} from 'lucide-react'
import { useNotification } from '@/components/ui/notification-provider'

export default function QuizSessionPage({ params }: { params: { sessionId: string } }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [confidenceLevel, setConfidenceLevel] = useState(3)

  const router = useRouter()
  const queryClient = useQueryClient()
  const { success, error, info } = useNotification()

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [currentQuestionIndex])

  // Mock quiz session data (would come from API in real implementation)
  const quizSession = {
    session_id: params.sessionId,
    topic_id: '660e8400-e29b-41d4-a716-446655440001',
    questions: [
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        question_text: 'Which of these is money?',
        question_type: 'multiple_choice',
        options: {
          A: 'Coins',
          B: 'Rocks', 
          C: 'Leaves',
          D: 'Toys'
        },
        hints: [
          'Think about what you use to buy things at the store',
          'Money is something valuable that everyone accepts',
          'Look for the option that has real value'
        ],
        estimated_time: 30,
        difficulty_level: 0.2
      },
      // Add more questions...
    ],
    current_question: 0,
    total_questions: 5,
    target_difficulty: 0.4
  }

  const submitAnswerMutation = useMutation({
    mutationFn: (answerData: any) => apiClient.submitAnswer(answerData),
    onSuccess: (data) => {
      setResult(data)
      setShowResult(true)
      
      if (data.is_correct) {
        success('Correct!', `+${data.xp_earned} XP earned`)
      } else {
        info('Not quite right', 'Let\'s learn from this!')
      }

      if (data.level_up) {
        success('Level Up!', 'You\'re getting stronger!')
      }
    },
    onError: (err: any) => {
      error('Error submitting answer', err.message)
    }
  })

  const completeQuizMutation = useMutation({
    mutationFn: () => apiClient.completeQuiz(params.sessionId),
    onSuccess: (data) => {
      success('Quiz Complete! 🏆', `Great job! You scored ${data.performance.accuracy}%`)
      router.push(`/quiz/results/${params.sessionId}`)
    }
  })

  const currentQuestion = quizSession.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quizSession.questions.length - 1

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) {
      error('Please select an answer', 'Choose one of the options below')
      return
    }

    submitAnswerMutation.mutate({
      session_id: params.sessionId,
      question_id: currentQuestion.id,
      user_answer: selectedAnswer,
      time_spent: timeSpent,
      hints_used: hintsUsed,
      confidence_level: confidenceLevel,
    })
  }

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      completeQuizMutation.mutate()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setTimeSpent(0)
      setHintsUsed(0)
      setShowHint(false)
      setShowResult(false)
      setConfidenceLevel(3)
    }
  }

  const handleUseHint = () => {
    if (hintsUsed < currentQuestion.hints.length) {
      setHintsUsed(prev => prev + 1)
      setShowHint(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">FQ</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Financial Learning Quiz</h1>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {quizSession.total_questions}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{formatTime(timeSpent)}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="xp-bar h-2">
              <motion.div
                className="xp-fill h-2"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIndex + 1) / quizSession.total_questions) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Question Card */}
            <div className="card text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-full mb-4">
                  <span className="text-2xl">🤔</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {currentQuestion.question_text}
                </h2>
                
                {/* Difficulty Indicator */}
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Star className="w-4 h-4" />
                  <span>
                    Difficulty: {Math.round(currentQuestion.difficulty_level * 100)}%
                  </span>
                </div>
              </div>

              {/* Answer Options */}
              {currentQuestion.question_type === 'multiple_choice' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {Object.entries(currentQuestion.options).map(([key, value]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedAnswer({ answer: key })}
                      disabled={showResult}
                      className={`
                        p-4 border-2 rounded-xl text-left transition-all
                        ${selectedAnswer?.answer === key
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                        ${showResult && selectedAnswer?.answer === key
                          ? result?.is_correct 
                            ? 'border-success-500 bg-success-50'
                            : 'border-red-500 bg-red-50'
                          : ''
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold
                          ${selectedAnswer?.answer === key
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-gray-300 text-gray-600'
                          }
                        `}>
                          {key}
                        </div>
                        <span className="font-medium">{value}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Confidence Slider */}
              {!showResult && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How confident are you? {confidenceLevel}/5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={confidenceLevel}
                    onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Not sure</span>
                    <span>Very confident</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {!showResult ? (
                  <>
                    <button
                      onClick={handleUseHint}
                      disabled={hintsUsed >= currentQuestion.hints.length}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>
                        Hint ({hintsUsed}/{currentQuestion.hints.length})
                      </span>
                    </button>

                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!selectedAnswer || submitAnswerMutation.isPending}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {submitAnswerMutation.isPending ? (
                        <div className="loading-spinner w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>Submit Answer</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    disabled={completeQuizMutation.isPending}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {completeQuizMutation.isPending ? (
                      <div className="loading-spinner w-4 h-4" />
                    ) : (
                      <>
                        {isLastQuestion ? (
                          <Star className="w-4 h-4" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                        <span>{isLastQuestion ? 'Complete Quiz' : 'Next Question'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Hint Display */}
            <AnimatePresence>
              {showHint && hintsUsed > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="card bg-yellow-50 border-yellow-200"
                >
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800 mb-2">Hint:</h3>
                      <p className="text-yellow-700">
                        {currentQuestion.hints[hintsUsed - 1]}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result Display */}
            <AnimatePresence>
              {showResult && result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`card ${result.is_correct ? 'bg-success-50 border-success-200' : 'bg-red-50 border-red-200'}`}
                >
                  <div className="flex items-start space-x-3">
                    {result.is_correct ? (
                      <CheckCircle className="w-6 h-6 text-success-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-2 ${result.is_correct ? 'text-success-800' : 'text-red-800'}`}>
                        {result.is_correct ? 'Correct! Well done! 🎉' : 'Not quite right 🤔'}
                      </h3>
                      
                      {result.explanation && (
                        <p className={`text-sm mb-3 ${result.is_correct ? 'text-success-700' : 'text-red-700'}`}>
                          {result.explanation}
                        </p>
                      )}

                      {result.is_correct && (
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Zap className="w-4 h-4 text-gamified-xp" />
                            <span className="font-medium text-gamified-xp">+{result.xp_earned} XP</span>
                          </div>
                          {result.level_up && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-medium text-yellow-600">Level Up!</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
