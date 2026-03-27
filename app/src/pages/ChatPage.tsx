import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { queryAPI } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Send, Loader } from 'lucide-react'

export default function ChatPage() {
  const { chatHistory, addMessage, sessionId, isLoading, setIsLoading } = useAppStore()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: inputValue,
      timestamp: new Date(),
    }
    addMessage(userMessage)
    setInputValue('')

    // Fetch AI response
    setIsLoading(true)
    try {
      const response = await queryAPI({
        query: inputValue,
        user_id: sessionId,
      })

      const assistantMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant' as const,
        content: response.answer,
        citations: response.citations,
        timestamp: new Date(),
      }
      addMessage(assistantMessage)
    } catch (error) {
      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }
      addMessage(errorMessage)
      console.error('Query error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-50">Tax Assistant Chat</h1>
        <p className="text-sm text-slate-400 mt-1">Ask questions about income tax, GST, and tax planning</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-300">Start a conversation</h2>
              <p className="text-slate-500 max-w-md">
                Ask me about Income Tax deductions, GST rates, tax saving strategies, and more!
              </p>
              <div className="text-slate-600 text-sm">
                <p>💡 Example: "What are Section 80C deduction limits?"</p>
                <p>💡 Example: "What's the GST rate on mobile phones?"</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((message) => (
              <div
                key={message.id}
                className={cn('flex gap-4', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-2xl rounded-xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-900 border border-slate-700 text-slate-50'
                  )}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-600 space-y-2">
                      <p className="text-xs font-semibold text-slate-300">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.citations.map((citation, idx) => (
                          <Badge key={idx} variant="citation" className="text-xs font-mono">
                            {citation}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs mt-2 opacity-70">{formatDate(message.timestamp)}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin text-teal-400" />
                  <span className="text-sm text-slate-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-slate-900/50 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask your tax question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? '' : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
