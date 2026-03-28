// MODIFIED: 2026-03-28 — layout restructure
// Changed: Complete replacement - left (logo + chat pill), center (empty), right (explore dropdown + auth/user + status dot)
// Preserved: All existing colors (#10b981, #020617), fonts, border/bg classes

import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  ChevronDown,
  MessageCircle,
  Calculator,
  FileText,
  DollarSign,
  PieChart,
  TrendingUp,
  LogOut,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import type { ActiveTab } from '../store/appStore'

interface NavbarProps {
  onLoginClick: () => void
  onRegisterClick: () => void
}

const FEATURES: {
  id: ActiveTab
  icon: React.ElementType
  name: string
  desc: string
  badge: string
}[] = [
  { id: 'chat', icon: MessageCircle, name: 'Chat', desc: 'AI tax & GST assistant', badge: 'AI' },
  { id: 'regime', icon: Calculator, name: 'Regime Calculator', desc: 'Old vs new regime', badge: 'TAX' },
  { id: 'document', icon: FileText, name: 'Document Upload', desc: 'Extract & analyze docs', badge: 'OCR' },
  { id: 'forex', icon: DollarSign, name: 'Forex Valuation', desc: 'Currency analysis', badge: 'FX' },
  { id: 'fund', icon: PieChart, name: 'Fund Accounting', desc: 'NAV & portfolio', badge: 'FUND' },
  { id: 'capital', icon: TrendingUp, name: 'Capital Budgeting', desc: 'NPV, IRR & payback', badge: 'FINANCE' },
]

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onRegisterClick }) => {
  const { activeTab, setActiveTab, accessToken, currentUser, logout } = useAppStore()
  const [exploreOpen, setExploreOpen] = useState(false)
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Ping Ollama health
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/health', { signal: AbortSignal.timeout(3000) })
        const data = await res.json()
        setOllamaOnline(data?.ollama_status === 'connected' || data?.status === 'ok')
      } catch {
        setOllamaOnline(false)
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click + Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExploreOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExploreOpen(false) }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const navigate = (tab: ActiveTab) => {
    setActiveTab(tab)
    setExploreOpen(false)
  }

  const userInitial = currentUser?.full_name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || '?'
  const userName = currentUser?.full_name || currentUser?.email || 'User'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-5"
      style={{
        background: 'rgba(2,6,23,0.92)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* LEFT GROUP */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2 group"
          title="Home"
        >
          <div className="w-8 h-8 rounded-md bg-[#10b981] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-[#059669] transition-colors">
            <span className="text-black font-black text-xs tracking-tighter">CA</span>
          </div>
          <span className="text-white font-bold text-sm tracking-tight hidden sm:block group-hover:text-[#10b981] transition-colors">
            CA-Assist
          </span>
        </button>

        {/* Chat pill button */}
        <button
          onClick={() => navigate('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150 ${
            activeTab === 'chat'
              ? 'bg-teal-950 border-teal-700 text-teal-400'
              : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
          }`}
        >
          <MessageSquare size={14} className={activeTab === 'chat' ? 'text-teal-400' : 'text-[#10b981]'} />
          Chat
        </button>
      </div>

      {/* RIGHT GROUP */}
      <div className="flex items-center gap-3 ml-auto">

        {/* Explore Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setExploreOpen(!exploreOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white text-xs font-semibold transition-all duration-150"
          >
            Explore
            <ChevronDown
              size={14}
              style={{
                transition: 'transform 150ms ease',
                transform: exploreOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Dropdown Panel */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: '340px',
              zIndex: 60,
              transition: 'opacity 150ms ease-out, transform 150ms ease-out',
              opacity: exploreOpen ? 1 : 0,
              transform: exploreOpen ? 'translateY(0)' : 'translateY(-6px)',
              pointerEvents: exploreOpen ? 'auto' : 'none',
              background: 'rgba(10,10,12,0.97)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '1rem',
              padding: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-2 pb-2 mb-1">
              All Features
            </p>

            <div className="grid grid-cols-2 gap-2">
              {FEATURES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => navigate(f.id)}
                  className="relative bg-white/[0.03] hover:bg-slate-700/60 border border-white/[0.06] hover:border-teal-700/60 rounded-xl p-3 cursor-pointer text-left group transition-all duration-150"
                >
                  <div className="absolute top-2 right-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#10b981]/10 text-[#10b981] text-[9px] uppercase font-bold tracking-widest border border-[#10b981]/20">
                      {f.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-0.5 pr-8">
                    <f.icon size={15} className="text-[#10b981] flex-shrink-0" />
                    <span className="text-sm font-semibold text-white">{f.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{f.desc}</p>
                </button>
              ))}
            </div>

            <div className="border-t border-white/5 mt-2 pt-2">
              <p className="text-xs text-slate-500 text-center">More features coming soon</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10 flex-shrink-0" />

        {/* Auth state */}
        {accessToken ? (
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-xs font-bold text-white">{userInitial}</span>
            </div>
            {/* Username */}
            <span className="text-sm text-slate-300 max-w-[100px] truncate hidden md:block">{userName}</span>
            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-red-400 hover:border-red-800 text-xs font-semibold transition-all duration-150"
            >
              <LogOut size={13} />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onLoginClick}
              className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white text-xs font-semibold transition-all duration-150"
            >
              Log in
            </button>
            <button
              onClick={onRegisterClick}
              className="px-3 py-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-black text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)]"
            >
              Sign up
            </button>
          </div>
        )}

        {/* Status dot */}
        <div
          title={ollamaOnline === null ? 'Checking...' : ollamaOnline ? 'AI Enhanced' : 'Basic Mode'}
          className="flex-shrink-0 ml-1"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              ollamaOnline === null
                ? 'bg-slate-500'
                : ollamaOnline
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-amber-400'
            }`}
          />
        </div>
      </div>
    </header>
  )
}
