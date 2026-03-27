import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from './store/appStore'
import Sidebar from './components/Sidebar'
import { ChatScreen } from './components/ChatScreen'
import { RegimeCalculator } from './components/RegimeCalculator'
import { DocumentUpload } from './components/DocumentUpload'
import { FundAccounting } from './components/FundAccounting'
import { HomeScreen } from './components/HomeScreen'
import { AuthModal } from './components/AuthModal'
// Import new pages
import ForexValuationPage from './pages/ForexValuationPage'
import InventoryValuationPage from './pages/InventoryValuationPage'
import CostingForecastingPage from './pages/CostingForecastingPage'
import MakeOrBuyPage from './pages/MakeOrBuyPage'
import AuditPage from './pages/AuditPage'
import { Moon, Sun, LogOut } from 'lucide-react'
import { Button } from './components/ui/Button'

function App() {
  const { activeTab, initSession, accessToken, logout } = useAppStore()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    initSession()
    setMounted(true)
  }, [initSession])

  // Show auth modal if not authenticated and viewing home
  useEffect(() => {
    if (mounted && !accessToken && activeTab !== 'home') {
      setShowAuthModal(true)
    }
  }, [mounted, accessToken, activeTab])

  const headerTitle = useMemo(() => {
    switch (activeTab) {
      case 'chat':
        return 'Chat AI'
      case 'regime':
        return 'Regime Calculator'
      case 'fund':
        return 'Fund Accounting'
      case 'document':
        return 'Document Upload'
      case 'forex':
        return 'Forex Valuation'
      case 'inventory':
        return 'Inventory Valuation'
      case 'costing':
        return 'Costing & Forecasting'
      case 'make-or-buy':
        return 'Make or Buy Decision'
      case 'audit':
        return 'Financial Audit'
      default:
        return 'Dashboard'
    }
  }, [activeTab])

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-950 text-slate-50 transition-colors duration-500">
      <div className="network-canvas absolute inset-0 pointer-events-none" aria-hidden="true" />

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="glass-taskbar mx-4 mt-4 rounded-2xl border border-white/12 bg-black/30 backdrop-blur-xl p-3 shadow-lg transition-all">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-md text-slate-100 font-bold">{headerTitle}</h2>
            {accessToken && (
              <Button
                onClick={logout}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </Button>
            )}
          </div>
        </header>

        <main className="relative flex-1 overflow-auto p-4">
          {activeTab === 'home' && <HomeScreen onAuthClick={() => setShowAuthModal(true)} />}
          {accessToken ? (
            <>
              {activeTab === 'chat' && <ChatScreen />}
              {activeTab === 'regime' && <RegimeCalculator />}
              {activeTab === 'document' && <DocumentUpload />}
              {activeTab === 'fund' && <FundAccounting />}
              {/* New Features */}
              {activeTab === 'forex' && <ForexValuationPage />}
              {activeTab === 'inventory' && <InventoryValuationPage />}
              {activeTab === 'costing' && <CostingForecastingPage />}
              {activeTab === 'make-or-buy' && <MakeOrBuyPage />}
              {activeTab === 'audit' && <AuditPage />}
            </>
          ) : (
            activeTab !== 'home' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-slate-400 mb-4">Please sign in to access this feature</p>
                  <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
                </div>
              </div>
            )
          )}
        </main>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}

export default App
