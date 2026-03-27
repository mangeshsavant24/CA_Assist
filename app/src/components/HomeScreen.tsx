import React from 'react'
import { Zap, Shield, BookOpen, ArrowRight, Upload, PieChart, TrendingUp, MessageSquare } from 'lucide-react'
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
      description: 'Ask AI-powered tax and GST questions with citations from authentic sources.',
      icon: MessageSquare,
      badge: 'AI Powered'
    },
    {
      id: 'regime',
      title: 'Regime Calculator',
      description: 'Compare old vs new tax regime and get personalized recommendations.',
      icon: TrendingUp,
      badge: 'Calculate'
    },
    {
      id: 'fund',
      title: 'Fund Accounting',
      description: 'Compute precise Net Asset Value (NAV) taking daily contributions across classes.',
      icon: PieChart,
      badge: 'Accounting'
    },
    {
      id: 'document',
      title: 'Document Upload',
      description: 'Intelligent extraction of key financial figures across massive PDF files instantly.',
      icon: Upload,
      badge: 'Extraction'
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Classic Dashboard Hero Box */}
      <div className="rounded-2xl bg-gradient-to-br from-[#021f14] to-[#010a08] border border-[#10b981]/20 p-8 md:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-40 bg-[#10b981]/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        
        <div className="relative z-10 flex flex-col items-start gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[#10b981] text-sm font-semibold tracking-wide">
            <Shield size={16} className="text-[#10b981] opacity-80" /> Professional Tax Assistant
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-[1.2] mt-2 mb-2 tracking-tight">
            CA-Assist: AI-Powered Tax <br className="hidden md:block"/>& Compliance
          </h1>
          
          <p className="text-[#a1a1aa] text-base leading-relaxed mb-6 font-medium">
            Get instant tax calculations, compliance guidance, and financial analysis powered by AI. All recommendations backed by citations to authentic tax sources.
          </p>
          
          <div className="pt-2">
            {!accessToken ? (
              <button onClick={onAuthClick} className="px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-black font-semibold rounded-lg transition-colors shadow-[0_4px_20px_rgba(16,185,129,0.3)] border border-[#10b981]">
                Sign In to Start
              </button>
            ) : (
              <button onClick={() => document.getElementById('features')?.scrollIntoView({behavior: 'smooth'})} className="px-6 py-2.5 bg-transparent border border-[#10b981]/50 text-[#10b981] hover:bg-[#10b981]/10 font-medium rounded-lg transition-colors">
                Explore Features
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Features */}
      <div id="features" className="space-y-5 pt-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap size={20} className="text-amber-400" /> Core Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.id}
              onClick={() => accessToken ? setActiveTab(f.id as any) : onAuthClick()}
              className={`rounded-xl bg-[#0a0a0a] border border-[#1f2937] hover:border-[#10b981]/40 p-6 transition-all duration-300 ${!accessToken ? 'opacity-80' : 'hover:bg-[#0f0f0f] cursor-pointer shadow-md'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/20">
                  <f.icon size={20} className="text-[#10b981]" />
                </div>
                <span className="px-2.5 py-1 rounded bg-[#10b981]/10 text-[#10b981] text-[10px] uppercase font-bold tracking-widest border border-[#10b981]/20">
                  {f.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-[#a1a1aa] text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
