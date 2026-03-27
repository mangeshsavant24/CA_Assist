import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import Sidebar from './components/Sidebar'
import { ChatScreen } from './components/ChatScreen'
import { RegimeCalculator } from './components/RegimeCalculator'
import { DocumentUpload } from './components/DocumentUpload'

function App() {
  const { activeTab, initSession } = useAppStore()

  useEffect(() => {
    initSession()
  }, [initSession])

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' && <ChatScreen />}
        {activeTab === 'regime' && <RegimeCalculator />}
        {activeTab === 'document' && <DocumentUpload />}
      </main>
    </div>
  )
}

export default App
