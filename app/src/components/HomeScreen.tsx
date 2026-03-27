import React from 'react'
import { MessageSquare, TrendingUp, Upload, PieChart, Zap, Shield, BookOpen } from 'lucide-react'
import { Button } from './ui/Button'
import { useAppStore } from '../store/appStore'

interface HomeScreenProps {
  onAuthClick: () => void
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onAuthClick }) => {
  const { accessToken, setActiveTab } = useAppStore()

  const features = [
    {
      id: 'chat',
      title: 'Tax & GST Chat',
      description: 'Ask AI-powered tax and GST questions with citations from authentic sources',
      icon: MessageSquare,
      color: 'from-teal-900 to-teal-800',
      iconColor: 'text-teal-400',
      tag: 'AI Powered',
    },
    {
      id: 'regime',
      title: 'Regime Calculator',
      description: 'Compare old vs new tax regime and get personalized recommendations',
      icon: TrendingUp,
      color: 'from-amber-900 to-amber-800',
      iconColor: 'text-amber-400',
      tag: 'Calculate',
    },
    {
      id: 'fund',
      title: 'Fund Accounting',
      description: 'Manage and analyze fund accounts with NAV calculations and insights',
      icon: PieChart,
      color: 'from-violet-900 to-violet-800',
      iconColor: 'text-violet-400',
      tag: 'Accounting',
    },
    {
      id: 'document',
      title: 'Document Upload',
      description: 'Upload salary slips, invoices, and documents for automated analysis',
      icon: Upload,
      color: 'from-green-900 to-green-800',
      iconColor: 'text-green-400',
      tag: 'Extraction',
    },
  ]

  const handleFeatureClick = (featureId: string) => {
    if (!accessToken) {
      onAuthClick()
    } else {
      setActiveTab(featureId as any)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900/50 via-slate-900 to-violet-900/50 border border-slate-700/50 p-8 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <Shield size={20} className="text-teal-400" />
            <span className="text-sm font-medium text-teal-400">Professional Tax Assistant</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-50 mb-4">
            CA-Assist: AI-Powered Tax & Compliance
          </h1>
          <p className="text-lg text-slate-300 mb-6">
            Get instant tax calculations, compliance guidance, and financial analysis powered by AI. 
            All recommendations backed by citations to authentic tax sources.
          </p>
          <div className="flex flex-wrap gap-3">
            {!accessToken && (
              <Button
                variant="primary"
                size="lg"
                onClick={onAuthClick}
              >
                Get Started
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const element = document.getElementById('features')
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Explore Features
            </Button>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Zap size={24} className="text-yellow-400" />
          <h2 className="text-2xl font-bold text-slate-50">Core Features</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon
            const isAccessible = accessToken || feature.id === 'home'

            return (
              <button
                key={feature.id}
                onClick={() => handleFeatureClick(feature.id)}
                className={`relative overflow-hidden rounded-xl p-6 text-left transition-all duration-300 border border-slate-700/50 group ${
                  isAccessible
                    ? 'hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50 cursor-pointer'
                    : 'opacity-75 cursor-not-allowed'
                }`}
                disabled={!isAccessible}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-20`}></div>

                {/* Content */}
                <div className="relative z-10 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors`}>
                      <Icon size={24} className={feature.iconColor} />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full">
                      {feature.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-50 group-hover:text-teal-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Hover border effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-teal-500/0 to-teal-500/0 group-hover:from-teal-500/10 group-hover:to-teal-500/0 transition-all pointer-events-none"></div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-8">
        <h2 className="text-2xl font-bold text-slate-50 mb-6">Why Choose CA-Assist?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-teal-400">100%</div>
            <p className="text-slate-400">
              Citations backed by authentic Indian tax laws and government sources
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-bold text-amber-400">Instant</div>
            <p className="text-slate-400">
              Get real-time calculations and recommendations without waiting
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-bold text-violet-400">Smart</div>
            <p className="text-slate-400">
              AI-powered analysis across tax, GST, and fund accounting
            </p>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="rounded-xl bg-gradient-to-r from-teal-900/30 to-violet-900/30 border border-slate-700 p-8">
        <div className="flex items-start gap-4">
          <BookOpen size={32} className="text-teal-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-slate-50 mb-2">Getting Started</h3>
            <p className="text-slate-400 mb-4">
              Sign in with your email to access all premium features. Our AI assistant is ready to help with:
            </p>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                Tax regime comparison and optimization
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                GST and compliance guidance
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                Fund accounting and NAV calculations
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                Document analysis and data extraction
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-yellow-950/30 border border-yellow-700 p-4">
        <p className="text-sm text-yellow-200">
          <strong>Disclaimer:</strong> This application provides AI-assisted guidance only and should not be considered a substitute for professional chartered accountant advice. Always consult with a qualified professional for critical financial and tax decisions.
        </p>
      </div>
    </div>
  )
}
