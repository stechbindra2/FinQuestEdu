'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-context'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  BookOpen, 
  Trophy, 
  User, 
  Menu, 
  X, 
  LogOut,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/learn', label: 'Learn', icon: BookOpen },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg group-hover:scale-105 transition-transform">
                <span className="text-lg font-bold text-white">FQ</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">FinQuest</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2
                    ${isActive(item.href) 
                      ? 'text-primary-600 bg-primary-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary-100 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* XP Display */}
            {profile && (
              <div className="hidden sm:flex items-center space-x-2 bg-gamified-xp/10 px-3 py-1 rounded-full">
                <Zap className="w-4 h-4 text-gamified-xp" />
                <span className="text-sm font-semibold text-gamified-xp">
                  {(profile as any).user_stats?.total_xp || 0} XP
                </span>
              </div>
            )}

            {/* User Avatar */}
            <div className="relative group">
              <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900">{profile?.full_name}</p>
                  <p className="text-sm text-gray-600">Grade {profile?.grade}</p>
                </div>
                <button
                  onClick={signOut}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors
                      ${isActive(item.href) 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              
              {/* XP Display Mobile */}
              {profile && (
                <div className="flex items-center space-x-3 px-3 py-2">
                  <Zap className="w-5 h-5 text-gamified-xp" />
                  <span className="font-semibold text-gamified-xp">
                    {(profile as any).user_stats?.total_xp || 0} XP
                  </span>
                </div>
              )}
              
              <button
                onClick={() => {
                  signOut()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
