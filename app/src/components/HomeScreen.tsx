// MODIFIED: 2026-03-28 — layout restructure
// Changed: Added upload+chat strip between hero card and feature grid,
//          randomized suggested prompt chips (3 of 5 shown), handleHomeSubmit → chatContext → navigate to chat
// Preserved: Hero card (dark green bg + content), feature cards grid, all existing colors and classes

import React, { useState, useRef, useMemo } from 'react'
import { Zap, Shield, Upload, PieChart, TrendingUp, MessageSquare, SendHorizonal, X } from 'lucide-react'
import { useAppStore } from '../store/appStore'

interface HomeScreenProps {
  onAuthClick: () => void
}

const ALL_PROMPTS = [
  'What is my 80C limit?',
  'Old vs new regime for ₹12L salary',
  'Do I need GST registration?',
  'Explain Section 44ADA',
  'How is HRA calculated?',
]

export const HomeScreen: React.FC<HomeScreenProps> = ({ onAuthClick }) => {
  const { accessToken, setActiveTab, setChatContext } = useAppStore()

  const [homeInput, setHomeInput] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Pick 3 random chips on mount
  const chips = useMemo(() => {
    const shuffled = [...ALL_PROMPTS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3)
  }, [])

  const handleHomeSubmit = () => {
    if (!accessToken) { onAuthClick(); return }
    if (!homeInput.trim() && !pendingFile) return

    if (pendingFile) {
      setChatContext({
        pendingFile: pendingFile,
        pendingMessage: homeInput.trim() || `I've uploaded ${pendingFile.name}. Please analyze it.`,
      })
    } else if (homeInput.trim()) {
      setChatContext({ pendingMessage: homeInput.trim() })
    }
    setActiveTab('chat')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleHomeSubmit()
    }
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHomeInput(e.target.value)
    // Auto-resize
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 72) + 'px'
    }
  }

  const features = [
    { id: 'chat', title: 'Tax & GST Chat', description: 'Ask AI-powered tax and GST questions with citations from authentic sources.', icon: MessageSquare, badge: 'AI Powered' },
    { id: 'regime', title: 'Regime Calculator', description: 'Compare old vs new tax regime and get personalized recommendations.', icon: TrendingUp, badge: 'Calculate' },
    { id: 'fund', title: 'Fund Accounting', description: 'Compute precise Net Asset Value (NAV) taking daily contributions across classes.', icon: PieChart, badge: 'Accounting' },
    { id: 'document', title: 'Document Upload', description: 'Intelligent extraction of key financial figures across massive PDF files instantly.', icon: Upload, badge: 'Extraction' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#021f14] to-[#010a08] border border-[#10b981]/20 p-8 md:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-40 bg-[#10b981]/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="relative z-10 flex flex-col items-start gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[#10b981] text-sm font-semibold tracking-wide">
            <Shield size={16} className="opacity-80" /> Professional Tax Assistant
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-[1.2] mt-2 mb-2 tracking-tight">
            CA-Assist: AI-Powered Tax <br className="hidden md:block" />& Compliance
          </h1>
          <p className="text-[#a1a1aa] text-base leading-relaxed mb-6 font-medium">
            Get instant tax calculations, compliance guidance, and financial analysis powered by AI. All recommendations backed by citations to authentic tax sources.
          </p>
          <div className="pt-2">
            {!accessToken ? (
              <button
                onClick={onAuthClick}
                className="px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-black font-semibold rounded-lg transition-colors shadow-[0_4px_20px_rgba(16,185,129,0.3)] border border-[#10b981]"
              >
                Sign In to Start
              </button>
            ) : (
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-2.5 bg-transparent border border-[#10b981]/50 text-[#10b981] hover:bg-[#10b981]/10 font-medium rounded-lg transition-colors"
              >
                Explore Features
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload + Chat Strip */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(10,10,12,0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex gap-3 items-end">
          {/* LEFT: Compact upload zone */}
          <div className="flex-shrink-0 w-36">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setPendingFile(e.target.files[0])}
            />
            {pendingFile ? (
              <div
                className="rounded-xl p-3 text-center border cursor-pointer transition-colors duration-200"
                style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.4)' }}
              >
                <p className="text-[10px] text-[#10b981] truncate font-medium">{pendingFile.name}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingFile(null) }}
                  className="mt-1 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl p-3 text-center border border-dashed cursor-pointer transition-colors duration-200 hover:border-teal-700"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <Upload size={20} className="text-[#10b981] mx-auto" />
                <p className="text-[10px] text-slate-400 mt-1">Upload doc</p>
              </div>
            )}
          </div>

          {/* CENTER: Chips + input */}
          <div className="flex-1 min-w-0">
            {/* Suggested prompt chips */}
            <div className="flex flex-wrap gap-2 mb-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setHomeInput(chip)}
                  className="rounded-full px-3 py-1 text-xs border transition-colors cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.10)',
                    color: '#a1a1aa',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.6)'
                    ;(e.currentTarget as HTMLElement).style.color = '#10b981'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)'
                    ;(e.currentTarget as HTMLElement).style.color = '#a1a1aa'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat input row */}
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={homeInput}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask CA-Assist anything about taxes, GST, compliance..."
                rows={1}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 text-white placeholder-slate-500 text-sm"
                style={{ maxHeight: '72px', overflowY: 'auto' }}
              />
              <button
                onClick={handleHomeSubmit}
                disabled={!homeInput.trim() && !pendingFile}
                className="flex-shrink-0 bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-xl px-4 py-3 transition-colors"
              >
                <SendHorizonal size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features Grid */}
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
