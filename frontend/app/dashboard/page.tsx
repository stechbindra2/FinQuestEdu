'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Navigation } from '@/components/ui/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Zap, 
  Target, 
  TrendingUp, 
  Calendar,
  Star,
  ArrowRight,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile } = useAuth()

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => apiClient.getUserStats(),
  })

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['userProgress'],
    queryFn: () => apiClient.getUserProgress(),
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiClient.getSubjects(),
  })

  const { data: motivation } = useQuery({
    queryKey: ['motivation'],
    queryFn: () => apiClient.getMotivation(),
  })

  if (statsLoading || progressLoading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600">
            Ready to continue your financial learning adventure?
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Zap className="w-6 h-6 text-gamified-xp" />}
            title="Total XP"
            value={userStats?.total_xp || 0}
            subtitle={`Level ${userStats?.level || 1}`}
            bgColor="bg-gradient-to-r from-green-400 to-green-500"
          />
          
          <StatCard
            icon={<Target className="w-6 h-6 text-primary-500" />}
            title="Topics Mastered"
            value={progress?.completedTopics || 0}
            subtitle={`${progress?.totalTopics || 0} total topics`}
            bgColor="bg-gradient-to-r from-primary-400 to-primary-500"
          />
          
          <StatCard
            icon={<Trophy className="w-6 h-6 text-gamified-gold" />}
            title="Badges Earned"
            value={userStats?.badges_earned || 0}
            subtitle={`${userStats?.current_streak || 0} day streak`}
            bgColor="bg-gradient-to-r from-yellow-400 to-yellow-500"
          />
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Learning Progress */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Learning Progress</h2>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            
            <div className="space-y-4">
              {subjects?.slice(0, 3).map((subject, index) => {
                const subjectProgress = progress?.subjectProgress?.[subject.id] || { total: 0, completed: 0 }
                const percentage = subjectProgress.total > 0 
                  ? Math.round((subjectProgress.completed / subjectProgress.total) * 100)
                  : 0
                
                return (
                  <div key={subject.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{subject.name}</span>
                      <span className="text-sm text-gray-600">{percentage}%</span>
                    </div>
                    <div className="xp-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
                        className="xp-fill"
                        style={{ backgroundColor: subject.color_hex }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            
            <Link 
              href="/learn" 
              className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700 font-medium group"
            >
              View all subjects
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Motivation & Next Steps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Quest Status</h2>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>

            {motivation && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-purple-700 mb-2">
                    Motivation Level: {Math.round(motivation.motivationLevel * 100)}%
                  </p>
                  <p className="text-purple-600">
                    {motivation.encouragementMessage}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Suggested Actions:</h3>
                  <ul className="space-y-1">
                    {motivation.suggestedActions?.slice(0, 3).map((action: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                {motivation.nextMilestone && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Next Milestone: {motivation.nextMilestone.description}
                    </p>
                    <div className="xp-bar h-2">
                      <div 
                        className="xp-fill h-2" 
                        style={{ width: `${motivation.nextMilestone.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <QuickActionCard
            href="/learn"
            icon={<BookOpen className="w-6 h-6 text-primary-500" />}
            title="Continue Learning"
            description="Pick up where you left off"
            bgColor="bg-primary-50 hover:bg-primary-100"
          />
          
          <QuickActionCard
            href="/quiz/adaptive"
            icon={<Zap className="w-6 h-6 text-yellow-500" />}
            title="Adaptive Quiz"
            description="AI-powered practice"
            bgColor="bg-yellow-50 hover:bg-yellow-100"
          />
          
          <QuickActionCard
            href="/leaderboard"
            icon={<Trophy className="w-6 h-6 text-gamified-gold" />}
            title="Leaderboard"
            description="See how you rank"
            bgColor="bg-orange-50 hover:bg-orange-100"
          />
          
          <QuickActionCard
            href="/profile"
            icon={<Calendar className="w-6 h-6 text-green-500" />}
            title="View Progress"
            description="Track your journey"
            bgColor="bg-green-50 hover:bg-green-100"
          />
        </motion.div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, subtitle, bgColor }: {
  icon: React.ReactNode
  title: string
  value: number
  subtitle: string
  bgColor: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="card relative overflow-hidden"
    >
      <div className={`absolute inset-0 ${bgColor} opacity-10`}></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            {icon}
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </motion.div>
  )
}

function QuickActionCard({ href, icon, title, description, bgColor }: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  bgColor: string
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className={`p-4 rounded-xl border border-gray-200 transition-all cursor-pointer ${bgColor}`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
