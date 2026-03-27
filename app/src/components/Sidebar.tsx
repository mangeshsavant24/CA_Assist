import { useAppStore } from '@/store/appStore'
import { MessageSquare, TrendingUp, Upload } from 'lucide-react'

export default function Sidebar() {
  const { activeTab, setActiveTab } = useAppStore()

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'regime', label: 'Regime Calculator', icon: TrendingUp },
    { id: 'document', label: 'Document Upload', icon: Upload },
  ]

  return (
    <div className="w-60 bg-slate-950 border-r border-slate-800 flex flex-col">
      {/* Logo Section */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-mono font-bold">CA</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-50">CA-Assist</h1>
            <p className="text-xs text-slate-400">Tax & Compliance</p>
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
                ? 'bg-teal-950 text-teal-400 border-r-2 border-teal-400'
                : 'text-slate-400 hover:text-slate-50 hover:bg-slate-900'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium text-sm">{label}</span>
          </button>
        ))}
      </nav>

      {/* Disclaimer */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 leading-relaxed">
          ⚠️ AI guidance only. Not a substitute for professional CA advice.
        </p>
      </div>
    </div>
  )
}
