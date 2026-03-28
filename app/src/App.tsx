// MODIFIED: 2026-03-28 — layout restructure
// Changed: Replaced embedded navbar with <Navbar> component, restructured content area,
//          Chat page now gets full viewport height, feature pages use standard scroll layout,
//          Added Capital Budgeting as standalone route, auth modals for login/register separately
// Preserved: CanvasDots, gradient background blobs, all component imports, auth logic, initSession

import { useEffect, useState } from 'react'
import { useAppStore } from './store/appStore'
import { ChatScreen } from './components/ChatScreen'
import { RegimeCalculator } from './components/RegimeCalculator'
import { CapitalBudgeting } from './components/CapitalBudgeting'
import { DocumentUpload } from './components/DocumentUpload'
import { FundAccounting } from './components/FundAccounting'
import { ForexValuation } from './components/ForexValuation'
import { HomeScreen } from './components/HomeScreen'
import { AuthModal } from './components/AuthModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Navbar } from './components/Navbar'
import { CanvasDots } from './components/CanvasDots'
import { LogOut } from 'lucide-react'
import { Button } from './components/ui/Button'

function App() {
  const { activeTab, setActiveTab, initSession, accessToken } = useAppStore()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    initSession()
    setMounted(true)
  }, [initSession])

  useEffect(() => {
    if (mounted && !accessToken && activeTab !== 'home') {
      setShowAuthModal(true)
      setAuthInitialMode('login')
    }
  }, [mounted, accessToken, activeTab])

  const openLogin = () => {
    setAuthInitialMode('login')
    setShowAuthModal(true)
  }

  const openRegister = () => {
    setAuthInitialMode('register')
    setShowAuthModal(true)
  }

  return (
    <ErrorBoundary>
      <div className="relative flex flex-col min-h-screen w-full bg-[#020617] text-slate-50 font-sans selection:bg-[#10b981]/30">

        {/* Background gradient blobs */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#10b981]/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#10b981]/5 blur-[100px]" />
        </div>

        <CanvasDots />

        {/* Navbar — fixed top, z-50 */}
        <Navbar onLoginClick={openLogin} onRegisterClick={openRegister} />

        {/* Main content — below fixed navbar (pt-16) */}
        {activeTab === 'home' && (
          <main className="relative z-20 pt-16 flex-1 overflow-auto hide-scrollbar">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
              <HomeScreen onAuthClick={openLogin} />
            </div>
          </main>
        )}

        {/* Chat — full viewport below navbar, no extra padding */}
        {activeTab === 'chat' && (
          <div className="relative z-20 pt-16 flex-1 flex flex-col" style={{ height: '100vh' }}>
            {accessToken ? (
              <ChatScreen />
            ) : (
              <AccessGate onAuthClick={openLogin} />
            )}
          </div>
        )}

        {/* Feature pages — scrollable, padded */}
        {(['regime', 'document', 'fund', 'forex', 'capital'] as const).includes(activeTab as any) && (
          <main className="relative z-20 pt-16 flex-1 overflow-auto hide-scrollbar">
            {accessToken ? (
              <div className="min-h-[calc(100vh-64px)] px-8 py-8 max-w-7xl mx-auto">
                {activeTab === 'regime' && <RegimeCalculator />}
                {activeTab === 'capital' && <CapitalBudgeting />}
                {activeTab === 'document' && <DocumentUpload />}
                {activeTab === 'fund' && <FundAccounting />}
                {activeTab === 'forex' && <ForexValuation />}
              </div>
            ) : (
              <AccessGate onAuthClick={openLogin} />
            )}
          </main>
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authInitialMode}
        />
      </div>
    </ErrorBoundary>
  )
}

function AccessGate({ onAuthClick }: { onAuthClick: () => void }) {
  return (
    <div className="flex items-center justify-center flex-1 p-8">
      <div className="text-center bg-black/40 backdrop-blur-2xl border border-white/5 p-12 rounded-[2rem] max-w-sm mx-auto shadow-2xl">
        <div className="w-20 h-20 bg-[#10b981]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#10b981]/20">
          <LogOut size={28} className="text-[#10b981]" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Access Restricted</h3>
        <p className="text-slate-400 mb-10 text-sm leading-relaxed">
          Sign in with your credentials to utilize the full power of our AI assistant.
        </p>
        <Button
          onClick={onAuthClick}
          className="w-full rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-bold py-6 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:scale-105 border-0"
        >
          Sign In to Continue
        </Button>
      </div>
    </div>
  )
}

export default App
