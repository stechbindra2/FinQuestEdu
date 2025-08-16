'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Navigation } from '@/components/ui/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Medal, 
  Crown,
  Zap,
  Calendar,
  Users,
  Star,
  TrendingUp
} from 'lucide-react'

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'xp' | 'streak' | 'weekly'>('xp')
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all')
  const { profile } = useAuth()

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', activeTab, gradeFilter === 'all' ? undefined : gradeFilter],
    queryFn: () => apiClient.getLeaderboard(activeTab, gradeFilter === 'all' ? undefined : gradeFilter),
  })

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => apiClient.getUserStats(),
  })

  const tabs = [
    { id: 'xp' as const, label: 'Total XP', icon: Zap, color: 'text-gamified-xp' },
    { id: 'streak' as const, label: 'Streak', icon: Calendar, color: 'text-orange-500' },
    { id: 'weekly' as const, label: 'This Week', icon: TrendingUp, color: 'text-purple-500' },
  ]

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-gamified-gold" />
      case 2:
        return <Medal className="w-6 h-6 text-gamified-silver" />
      case 3:
        return <Trophy className="w-6 h-6 text-gamified-bronze" />
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
    return 'bg-gray-100 text-gray-700'
  }

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏆 Hall of Fame
          </h1>
          <p className="text-gray-600">
            See how you rank against other financial learners!
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2
                  ${activeTab === tab.id
                    ? 'bg-white shadow-lg text-gray-900 border-2 border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : ''}`} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeLeaderboardTab"
                    className="absolute inset-0 bg-primary-50 rounded-xl -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Grade Filter */}
        <div className="flex justify-center mb-8">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Grades</option>
            <option value={3}>Grade 3</option>
            <option value={4}>Grade 4</option>
            <option value={5}>Grade 5</option>
            <option value={6}>Grade 6</option>
            <option value={7}>Grade 7</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-gamified-gold" />
                  {tabs.find(t => t.id === activeTab)?.label} Leaders
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{leaderboard?.length || 0} players</span>
                </div>
              </div>

              <div className="space-y-3">
                {leaderboard?.map((entry, index) => (
                  <motion.div
                    key={entry.user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${entry.user.id === profile?.id
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold
                        ${getRankBadge(entry.rank)}
                      `}>
                        {entry.rank <= 3 ? getRankIcon(entry.rank) : `#${entry.rank}`}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{entry.user.name}</h3>
                          {entry.user.id === profile?.id && (
                            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Grade {entry.user.grade} • Level {entry.stats?.level || 1}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {activeTab === 'xp' && `${entry.score?.toLocaleString() || 0}`}
                          {activeTab === 'streak' && `${entry.score || 0} days`}
                          {activeTab === 'weekly' && `${entry.score?.toLocaleString() || 0} XP`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.stats?.badges_earned || 0} badges
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {(!leaderboard || leaderboard.length === 0) && (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No rankings yet</h3>
                    <p className="text-gray-600">Be the first to start learning and climb the leaderboard!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Your Stats
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total XP</span>
                  <span className="font-semibold text-gamified-xp">
                    {userStats?.total_xp?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Level</span>
                  <span className="font-semibold text-primary-600">
                    {userStats?.level || 1}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Streak</span>
                  <span className="font-semibold text-orange-600">
                    {userStats?.current_streak || 0} days
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Badges Earned</span>
                  <span className="font-semibold text-purple-600">
                    {userStats?.badges_earned || 0}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Accuracy</span>
                    <span className="font-medium">
                      {userStats?.total_questions_answered > 0
                        ? Math.round((userStats.total_correct_answers / userStats.total_questions_answered) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Climb Higher!</h3>
              
              <div className="space-y-3">
                <button className="w-full p-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all">
                  Take Adaptive Quiz
                </button>
                
                <button className="w-full p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all">
                  Continue Learning
                </button>
                
                <button className="w-full p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all">
                  View Badges
                </button>
              </div>
            </motion.div>

            {/* Achievement Spotlight */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Challenge</h3>
              <p className="text-sm text-gray-700 mb-3">
                Reach the top 10 this week and earn the "Rising Star" badge!
              </p>
              <div className="bg-white/50 p-2 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">7/10</span>
                </div>
                <div className="xp-bar h-2 mt-1">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
