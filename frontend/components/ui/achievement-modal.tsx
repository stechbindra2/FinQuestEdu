'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Star, Zap } from 'lucide-react'
import { useEffect } from 'react'

interface Achievement {
  type: 'badge' | 'level_up' | 'xp' | 'streak'
  title: string
  description: string
  icon?: string
  value?: number
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
}

interface AchievementModalProps {
  isOpen: boolean
  onClose: () => void
  achievement: Achievement
}

export function AchievementModal({ isOpen, onClose, achievement }: AchievementModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  const getIcon = () => {
    switch (achievement.type) {
      case 'badge':
        return achievement.icon || '🏆'
      case 'level_up':
        return '⭐'
      case 'xp':
        return '⚡'
      case 'streak':
        return '🔥'
      default:
        return '🎉'
    }
  }

  const getColors = () => {
    switch (achievement.rarity || achievement.type) {
      case 'legendary':
        return 'from-purple-500 to-pink-500'
      case 'epic':
        return 'from-orange-500 to-red-500'
      case 'rare':
        return 'from-blue-500 to-indigo-500'
      case 'level_up':
        return 'from-yellow-400 to-orange-500'
      case 'streak':
        return 'from-red-400 to-orange-500'
      default:
        return 'from-green-400 to-blue-500'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.5 
            }}
            className="relative bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Celebration Particles */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  initial={{ 
                    opacity: 0,
                    scale: 0,
                    x: 200,
                    y: 200,
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.random() * 400 - 200,
                    y: Math.random() * 400 - 200,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Achievement Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                delay: 0.2 
              }}
              className={`
                w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r ${getColors()} 
                flex items-center justify-center text-4xl shadow-lg
              `}
            >
              {achievement.type === 'badge' ? (
                <span>{getIcon()}</span>
              ) : achievement.type === 'level_up' ? (
                <Star className="w-12 h-12 text-white" />
              ) : achievement.type === 'xp' ? (
                <Zap className="w-12 h-12 text-white" />
              ) : (
                <Trophy className="w-12 h-12 text-white" />
              )}
            </motion.div>

            {/* Achievement Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              {achievement.title}
            </motion.h2>

            {/* Achievement Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600 mb-6"
            >
              {achievement.description}
            </motion.p>

            {/* Value Display */}
            {achievement.value && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className={`
                  inline-block px-6 py-3 bg-gradient-to-r ${getColors()} 
                  text-white rounded-full font-bold text-lg mb-6
                `}
              >
                +{achievement.value} {achievement.type === 'xp' ? 'XP' : ''}
              </motion.div>
            )}

            {/* Rarity Badge */}
            {achievement.rarity && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className={`
                  inline-block px-3 py-1 rounded-full text-sm font-medium mb-4
                  ${achievement.rarity === 'legendary' ? 'bg-purple-100 text-purple-700' :
                    achievement.rarity === 'epic' ? 'bg-orange-100 text-orange-700' :
                    achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'}
                `}
              >
                {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)} Achievement
              </motion.div>
            )}

            {/* Continue Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full btn-primary"
            >
              Awesome! Continue Learning
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
