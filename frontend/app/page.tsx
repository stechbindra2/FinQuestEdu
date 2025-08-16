import Link from 'next/link'
import { ArrowRight, BookOpen, Trophy, Zap, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="floating-animation mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Learn Finance Through{' '}
              <span className="text-gradient">Fun Adventures!</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join thousands of students on FinQuest - where learning personal finance 
              becomes an exciting game! Earn XP, unlock badges, and master money skills 
              that will last a lifetime.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/register" className="btn-primary text-lg px-8 py-4 group">
                Start Your Quest
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link href="/auth/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Kids Love FinQuest
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform adapts to each student's learning style and pace
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-yellow-500" />}
              title="AI-Powered Learning"
              description="Smart algorithm adjusts difficulty in real-time based on your progress"
            />
            
            <FeatureCard
              icon={<Trophy className="w-8 h-8 text-gamified-gold" />}
              title="Earn Rewards"
              description="Collect XP, unlock badges, and climb leaderboards as you learn"
            />
            
            <FeatureCard
              icon={<BookOpen className="w-8 h-8 text-primary-500" />}
              title="Grade-Specific Content"
              description="Age-appropriate lessons for grades 3-7 covering all finance basics"
            />
            
            <FeatureCard
              icon={<Users className="w-8 h-8 text-secondary-500" />}
              title="Social Learning"
              description="Compete with classmates and friends in a safe, educational environment"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <StatCard number="10,000+" label="Happy Students" />
            <StatCard number="500+" label="Schools Using FinQuest" />
            <StatCard number="95%" label="Improved Test Scores" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Start Your Financial Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join FinQuest today and give your child the financial literacy skills they need for life.
          </p>
          
          <Link href="/auth/register" className="btn-primary text-lg px-8 py-4 inline-flex items-center group">
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="card text-center group hover:scale-105 transition-transform">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl md:text-5xl font-bold mb-2">{number}</div>
      <div className="text-xl opacity-90">{label}</div>
    </div>
  )
}
