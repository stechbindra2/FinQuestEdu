'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Navigation } from '@/components/ui/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { motion } from 'framer-motion'
import { 
  User, 
  Trophy,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Clock,
  BookOpen,
  Edit3,
  Save,
  X
} from 'lucide-react'
import { useNotification } from '@/components/ui/notification-provider'

interface ProfileEditData {
  full_name?: string;
  school?: string;
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<ProfileEditData>({})
  const { profile, updateProfile } = useAuth()
  const { success, error } = useNotification()

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => apiClient.getUserStats(),
  })

  const { data: progress } = useQuery({
    queryKey: ['userProgress'],
    queryFn: () => apiClient.getUserProgress(),
  })

  const { data: badges } = useQuery({
    queryKey: ['userBadges'],
    queryFn: () => apiClient.getUserBadges(),
  })

  const { data: quizHistory } = useQuery({
    queryKey: ['quizHistory'],
    queryFn: () => apiClient.getQuizHistory(),
  })

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile(editData)
      if (result.error) {
        error('Failed to update profile', result.error)
      } else {
        success('Profile updated!', 'Your changes have been saved')
        setIsEditing(false)
        setEditData({})
      }
    } catch (err) {
      error('An error occurred', 'Please try again later')
    }
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥'
    if (streak >= 14) return '⚡'
    if (streak >= 7) return '🌟'
    if (streak >= 3) return '✨'
    return '💫'
  }

  const getLevelColor = (level: number) => {
    if (level >= 20) return 'from-purple-500 to-pink-500'
    if (level >= 15) return 'from-indigo-500 to-purple-500'
    if (level >= 10) return 'from-blue-500 to-indigo-500'
    if (level >= 5) return 'from-green-500 to-blue-500'
    return 'from-yellow-500 to-green-500'
  }

  return (
    <div>
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="card text-center">
              {/* Avatar */}
              <div className="relative mb-6">
                <div className={`
                  w-24 h-24 mx-auto rounded-full bg-gradient-to-r ${getLevelColor(userStats?.level || 1)} 
                  flex items-center justify-center text-white text-3xl font-bold shadow-lg
                `}>
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                
                {/* Level Badge */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white border-2 border-primary-500 rounded-full px-3 py-1 text-sm font-bold text-primary-600">
                    Level {userStats?.level || 1}
                  </div>
                </div>
              </div>

              {/* User Info */}
              {!isEditing ? (
                <div className="space-y-2 mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name}</h1>
                  <p className="text-gray-600">Grade {profile?.grade}</p>
                  {profile?.school && (
                    <p className="text-sm text-gray-500">{profile.school}</p>
                  )}
                  
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setEditData({
                        full_name: profile?.full_name,
                        school: profile?.school || '',
                      })
                    }}
                    className="mt-4 flex items-center space-x-2 mx-auto text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    value={editData.full_name || ''}
                    onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                    className="input-field text-center"
                    placeholder="Full Name"
                  />
                  <input
                    type="text"
                    value={editData.school || ''}
                    onChange={(e) => setEditData({...editData, school: e.target.value})}
                    className="input-field text-center"
                    placeholder="School (optional)"
                  />
                  
                  <div className="flex space-x-2 justify-center">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setEditData({})
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {userStats?.total_xp?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-green-700">Total XP</p>
                </div>
                
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600 flex items-center justify-center">
                    {getStreakEmoji(userStats?.current_streak || 0)}
                    {userStats?.current_streak || 0}
                  </p>
                  <p className="text-sm text-orange-700">Day Streak</p>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {userStats?.badges_earned || 0}
                  </p>
                  <p className="text-sm text-purple-700">Badges</p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {progress?.completedTopics || 0}
                  </p>
                  <p className="text-sm text-blue-700">Topics</p>
                </div>
              </div>

              {/* Next Level Progress */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Next Level</span>
                  <span className="text-sm text-gray-600">
                    {((userStats?.total_xp || 0) % 1000)}/1000 XP
                  </span>
                </div>
                <div className="xp-bar h-2">
                  <div 
                    className="xp-fill h-2"
                    style={{ width: `${((userStats?.total_xp || 0) % 1000) / 10}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Achievement Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                Achievement Badges
              </h2>

              {badges && badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {badges.map((userBadge, index) => (
                    <motion.div
                      key={userBadge.badge_id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl text-center"
                    >
                      <div className="text-3xl mb-2">{userBadge.badges.icon || '🏆'}</div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {userBadge.badges.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {userBadge.badges.description}
                      </p>
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${userBadge.badges.rarity === 'legendary' ? 'bg-purple-100 text-purple-700' :
                          userBadge.badges.rarity === 'epic' ? 'bg-orange-100 text-orange-700' :
                          userBadge.badges.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'}
                      `}>
                        {userBadge.badges.rarity}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No badges yet</h3>
                  <p className="text-gray-600">Start learning to earn your first badge!</p>
                </div>
              )}
            </motion.div>

            {/* Learning Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                Learning Progress
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Overall Progress</span>
                    <span className="text-sm text-gray-600">
                      {progress?.completedTopics || 0}/{progress?.totalTopics || 0}
                    </span>
                  </div>
                  <div className="xp-bar h-3">
                    <div 
                      className="xp-fill h-3"
                      style={{ 
                        width: `${progress?.totalTopics > 0 ? (progress.completedTopics / progress.totalTopics) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Average Mastery</span>
                    <span className="text-sm text-gray-600">
                      {Math.round((progress?.averageMastery || 0) * 100)}%
                    </span>
                  </div>
                  <div className="xp-bar h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(progress?.averageMastery || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Subject Progress */}
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Subject Breakdown</h3>
                {progress?.subjectProgress && Object.entries(progress.subjectProgress).map(([subjectId, data]: [string, any]) => (
                  <div key={subjectId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Subject {subjectId}</span>
                      <span className="text-sm text-gray-600">{data.completed}/{data.total}</span>
                    </div>
                    <div className="xp-bar h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
                        style={{ width: `${data.total > 0 ? (data.completed / data.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-500" />
                Recent Quiz Sessions
              </h2>

              {quizHistory && quizHistory.length > 0 ? (
                <div className="space-y-4">
                  {quizHistory.slice(0, 5).map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {session.topics?.name || 'Quiz Session'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(session.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {session.correct_answers}/{session.total_questions}
                        </p>
                        <p className="text-sm text-gray-600">
                          {Math.round((session.correct_answers / session.total_questions) * 100)}%
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No quiz history</h3>
                  <p className="text-gray-600">Take your first quiz to see your progress here!</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
