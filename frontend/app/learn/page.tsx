'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Navigation } from '@/components/ui/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Star, 
  Lock,
  CheckCircle,
  Play,
  Trophy
} from 'lucide-react'
import Link from 'next/link'

export default function LearnPage() {
  const { profile } = useAuth()

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiClient.getSubjects(),
  })

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics', profile?.grade],
    queryFn: () => profile?.grade ? apiClient.getTopicsByGrade(profile.grade) : Promise.resolve([]),
    enabled: !!profile?.grade,
  })

  const { data: userMastery } = useQuery({
    queryKey: ['userMastery'],
    queryFn: () => apiClient.getUserMastery(),
  })

  if (subjectsLoading || topicsLoading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Group topics by subject
  const topicsBySubject = topics?.reduce((acc, topic) => {
    const subjectId = topic.subjects?.id
    if (!acc[subjectId]) {
      acc[subjectId] = []
    }
    acc[subjectId].push(topic)
    return acc
  }, {}) || {}

  // Create mastery lookup
  type MasteryItem = { topic_id: string; [key: string]: any };
  
  const masteryLookup = userMastery?.reduce((acc: Record<string, any>, mastery: MasteryItem) => {
    acc[mastery.topic_id] = mastery
    return acc
  }, {} as Record<string, any>) || {}

  return (
    <div>
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Learning Center 📚
          </h1>
          <p className="text-gray-600">
            Explore topics designed for Grade {profile?.grade} students
          </p>
        </motion.div>

        {/* Subjects Grid */}
        <div className="space-y-12">
          {subjects?.map((subject, subjectIndex) => {
            const subjectTopics = topicsBySubject[subject.id] || []
            const completedTopics = subjectTopics.filter((topic: any) => 
              masteryLookup[topic.id]?.mastery_score >= 0.8
            ).length

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: subjectIndex * 0.1 }}
                className="space-y-6"
              >
                {/* Subject Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl"
                      style={{ backgroundColor: subject.color_hex }}
                    >
                      {subject.icon === 'piggy-bank' && '🐷'}
                      {subject.icon === 'shopping-cart' && '🛒'}
                      {subject.icon === 'building-2' && '🏦'}
                      {subject.icon === 'trending-up' && '📈'}
                      {subject.icon === 'lightbulb' && '💡'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{subject.name}</h2>
                      <p className="text-gray-600">{subject.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Progress</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {completedTopics}/{subjectTopics.length}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="xp-bar h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${subjectTopics.length > 0 ? (completedTopics / subjectTopics.length) * 100 : 0}%`,
                      backgroundColor: subject.color_hex 
                    }}
                  />
                </div>

                {/* Topics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjectTopics.map((topic: any, topicIndex: number) => {
                    const mastery = masteryLookup[topic.id]
                    const isCompleted = mastery?.mastery_score >= 0.8
                    const isStarted = mastery && mastery.attempts > 0
                    const masteryPercentage = mastery ? Math.round(mastery.mastery_score * 100) : 0

                    return (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        mastery={mastery}
                        isCompleted={isCompleted}
                        isStarted={isStarted}
                        masteryPercentage={masteryPercentage}
                        subjectColor={subject.color_hex}
                        delay={topicIndex * 0.05}
                      />
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TopicCard({ 
  topic, 
  mastery, 
  isCompleted, 
  isStarted, 
  masteryPercentage, 
  subjectColor, 
  delay 
}: {
  topic: any
  mastery: any
  isCompleted: boolean
  isStarted: boolean
  masteryPercentage: number
  subjectColor: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="card-interactive relative overflow-hidden"
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        {isCompleted ? (
          <div className="flex items-center space-x-1 bg-success-100 text-success-700 px-2 py-1 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>Mastered</span>
          </div>
        ) : isStarted ? (
          <div className="flex items-center space-x-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
            <Play className="w-3 h-3" />
            <span>In Progress</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
            <BookOpen className="w-3 h-3" />
            <span>New</span>
          </div>
        )}
      </div>

      {/* Topic Content */}
      <div className="space-y-4">
        <div className="pr-20">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{topic.name}</h3>
          <p className="text-sm text-gray-600">{topic.description}</p>
        </div>

        {/* Learning Objectives */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Learning Goals:</p>
          <ul className="space-y-1">
            {topic.learning_objectives?.slice(0, 2).map((objective: string, index: number) => (
              <li key={index} className="text-xs text-gray-600 flex items-start">
                <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                {objective}
              </li>
            ))}
          </ul>
        </div>

        {/* Progress Section */}
        {isStarted && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Mastery</span>
              <span className="text-xs font-medium text-gray-700">{masteryPercentage}%</span>
            </div>
            <div className="xp-bar h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${masteryPercentage}%`,
                  backgroundColor: subjectColor 
                }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        {mastery && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>{mastery.attempts} attempts</span>
            <span>{mastery.correct_answers}/{mastery.attempts} correct</span>
          </div>
        )}

        {/* Action Button */}
        <Link href={`/learn/topic/${topic.id}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full btn-primary text-sm py-2 flex items-center justify-center space-x-2"
            style={{ backgroundColor: subjectColor }}
          >
            {isCompleted ? (
              <>
                <Trophy className="w-4 h-4" />
                <span>Review</span>
              </>
            ) : isStarted ? (
              <>
                <Play className="w-4 h-4" />
                <span>Continue</span>
              </>
            ) : (
              <>
                <Star className="w-4 h-4" />
                <span>Start Learning</span>
              </>
            )}
          </motion.button>
        </Link>
      </div>
    </motion.div>
  )
}
