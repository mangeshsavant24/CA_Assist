import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from './store/appStore'
import { ChatScreen } from './components/ChatScreen'
import { RegimeCalculator } from './components/RegimeCalculator'
import { DocumentUpload } from './components/DocumentUpload'
import { FundAccounting } from './components/FundAccounting'
import { HomeScreen } from './components/HomeScreen'
import { AuthModal } from './components/AuthModal'
import { LogOut, Menu, X, Home, MessageSquare, TrendingUp, PieChart, Upload } from 'lucide-react'
import { Button } from './components/ui/Button'
import { CanvasDots } from './components/CanvasDots'

function App() {
  const { activeTab, setActiveTab, initSession, accessToken, logout } = useAppStore()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    initSession()
    setMounted(true)
  }, [initSession])

  useEffect(() => {
    if (mounted && !accessToken && activeTab !== 'home') {
      setShowAuthModal(true)
    }
  }, [mounted, accessToken, activeTab])

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'regime', label: 'Regime Calculator', icon: TrendingUp },
    { id: 'fund', label: 'Fund Accounting', icon: PieChart },
    { id: 'document', label: 'Document Upload', icon: Upload },
  ]

  const headerTitle = useMemo(() => {
    switch (activeTab) {
      case 'chat': return 'Chat AI'
      case 'regime': return 'Regime Calculator'
      case 'fund': return 'Fund Accounting'
      case 'document': return 'Document Upload'
      default: return 'Dashboard'
    }
  }, [activeTab])

  return (
    <div className="relative flex flex-col h-screen w-full overflow-hidden bg-[#050505] text-slate-50 font-sans selection:bg-[#10b981]/30">
      
      {/* Background gradients for premium glowing feel */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#10b981]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#10b981]/5 blur-[100px]" />
      </div>

      <CanvasDots />

      {/* Floating Pill Navbar */}
      <header className="relative z-30 mx-4 lg:mx-auto lg:max-w-5xl mt-6 rounded-full bg-black/40 backdrop-blur-2xl border border-white/5 p-2 shadow-[0_8px_40px_-12px_rgba(16,185,129,0.2)] transition-all">
        <div className="flex items-center justify-between gap-4 px-2">
          
          {/* Logo Group */}
          <div className="flex items-center gap-3 pl-2">
            <div className="w-8 h-8 rounded-md bg-[#10b981] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <span className="text-black font-black text-xs tracking-tighter">CA</span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight hidden sm:block">
              CA-Assist
            </h1>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.02] p-1 rounded-full border border-white/[0.02] shadow-inner">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                  activeTab === id
                    ? 'bg-white/10 text-[#10b981] shadow-sm border border-[#10b981]/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Actions Group */}
          <div className="flex items-center gap-2 pr-1">
             {accessToken ? (
              <Button onClick={logout} size="sm" className="rounded-full h-8 px-4 bg-white/5 hover:bg-white/10 border-0 text-white text-xs font-semibold backdrop-blur-md transition-all">
                Logout
              </Button>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} size="sm" className="rounded-full h-8 px-5 bg-[#10b981] hover:bg-[#059669] text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] border-0 transition-all hover:scale-105">
                Sign In
              </Button>
            )}
            <button className="md:hidden p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[110%] left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-2xl rounded-2xl p-2 border border-white/10 shadow-2xl space-y-1">
             {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === id
                    ? 'bg-[#10b981]/10 text-[#10b981]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 overflow-auto p-4 md:p-6 lg:p-10 hide-scrollbar mt-4">
        <div className="max-w-7xl mx-auto h-full w-full flex flex-col">
          {activeTab !== 'home' && (
            <div className="mb-8 pl-4">
              <h2 className="text-3xl font-black tracking-tighter text-white drop-shadow-sm">{headerTitle}</h2>
            </div>
          )}

          {activeTab === 'home' && <HomeScreen onAuthClick={() => setShowAuthModal(true)} />}
          
          <div className="flex-1 min-h-0">
            {accessToken ? (
              activeTab !== 'home' && (
                <div className="h-full rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/5 shadow-2xl overflow-y-auto custom-scrollbar relative p-6">
                  {/* Neon Line Top */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#10b981]/50 to-transparent"></div>
                  {activeTab === 'chat' && <ChatScreen />}
                  {activeTab === 'regime' && <RegimeCalculator />}
                  {activeTab === 'document' && <DocumentUpload />}
                  {activeTab === 'fund' && <FundAccounting />}
                </div>
              )
            ) : (
              activeTab !== 'home' && (
                <div className="flex items-center justify-center h-[calc(100%-4rem)]">
                  <div className="text-center bg-[#111111]/80 backdrop-blur-2xl border border-white/5 p-12 rounded-[2rem] max-w-sm mx-auto shadow-2xl">
                    <div className="w-20 h-20 bg-[#10b981]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#10b981]/20">
                      <LogOut size={28} className="text-[#10b981]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Access Restricted</h3>
                    <p className="text-slate-400 mb-10 text-sm leading-relaxed">Sign in with your secure credentials to utilize the full power of our autonomous assistant.</p>
                    <Button onClick={() => setShowAuthModal(true)} className="w-full rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-bold py-6 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:scale-105 border-0">
                      Sign In to Continue
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}

export default App
