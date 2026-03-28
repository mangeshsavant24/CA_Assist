import { useAppStore } from '@/store/appStore'
import { 
  MessageSquare, TrendingUp, Upload, PieChart,
  DollarSign
} from 'lucide-react'

export default function Sidebar() {
  const { activeTab, setActiveTab } = useAppStore()

  const navItems = [
    { id: 'home', label: 'Home', icon: MessageSquare },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'regime', label: 'Regime Calculator', icon: TrendingUp },
    { id: 'fund', label: 'Fund Accounting', icon: PieChart },
    { id: 'document', label: 'Document Upload', icon: Upload },
    // New Feature Tabs
    { id: 'forex', label: 'Forex Valuation', icon: DollarSign },
  ]

  return (
    <div className="sidebar w-60 bg-[#0a0a0a] border-r border-white/5 flex flex-col backdrop-blur-2xl">
      {/* Logo Section */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center">
            <span className="text-white font-mono font-bold">CA</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">CA-Assist</h1>
            <p className="text-xs text-[#a1a1aa]">Tax & Compliance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === id
                ? 'bg-emerald-950/40 text-[#10b981] border-r-2 border-[#10b981]'
                : 'text-[#a1a1aa] hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium text-sm">{label}</span>
          </button>
        ))}
      </nav>

      {/* Disclaimer */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-[#a1a1aa] leading-relaxed">
          ⚠️ AI guidance only. Not a substitute for professional CA advice.
        </p>
      </div>
    </div>
  )
}
