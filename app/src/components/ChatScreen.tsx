import React, { useState, useRef, useEffect } from 'react';
import {
  Scale,
  Receipt,
  Lightbulb,
  Send,
  Loader,
  BookOpen,
  FileText,
  Zap,
  X,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useAppStore } from '../store/appStore';
import { queryAPI } from '../lib/api';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: 'tax' | 'gst' | 'advisory';
  citations?: Array<{
    source: string;
    section: string;
    act: string;
    url?: string;
  }>;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'What is the 80C deduction limit?',
  'Old vs new tax regime — which is better?',
  'Do I need GST registration as a freelancer?',
  'How is HRA exemption calculated?',
  'What is Section 44ADA for freelancers?',
  'What deductions reduce taxable income most?',
];

const AgentBadge = ({ agent }: { agent?: string }) => {
  if (agent === 'tax') {
    return (
      <div className="inline-flex items-center gap-1 bg-teal-950 text-teal-400 border border-teal-800 rounded-full px-2 py-0.5 text-xs font-medium mb-2">
        <Scale size={12} />
        Tax Agent
      </div>
    );
  }
  if (agent === 'gst') {
    return (
      <div className="inline-flex items-center gap-1 bg-violet-950 text-violet-400 border border-violet-800 rounded-full px-2 py-0.5 text-xs font-medium mb-2">
        <Receipt size={12} />
        GST Agent
      </div>
    );
  }
  if (agent === 'advisory') {
    return (
      <div className="inline-flex items-center gap-1 bg-amber-950 text-amber-400 border border-amber-800 rounded-full px-2 py-0.5 text-xs font-medium mb-2">
        <Lightbulb size={12} />
        Advisory Agent
      </div>
    );
  }
  return null;
};

const CitationChip = ({ citation }: { citation: any }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-xs text-slate-400 hover:border-teal-500 hover:text-teal-400 transition-colors inline-flex items-center gap-1.5"
      >
        <FileText size={12} />
        {citation.section ? `ITA 1961 · §${citation.section}` : citation.source}
      </button>
      {expanded && (
        <div className="bg-slate-900 border border-teal-500/50 rounded-lg p-3 mt-2 text-xs text-slate-300 border-l-2 border-l-teal-500">
          <div className="mb-1">
            <span className="text-slate-500">Act:</span> {citation.act}
          </div>
          {citation.section && (
            <div className="mb-1">
              <span className="text-slate-500">Section:</span> {citation.section}
            </div>
          )}
          {citation.url && (
            <div>
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:underline"
              >
                View Source
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-1.5">
    <div
      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
      style={{ animationDelay: '0ms' }}
    />
    <div
      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
      style={{ animationDelay: '150ms' }}
    />
    <div
      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
      style={{ animationDelay: '300ms' }}
    />
  </div>
);

const formatMessageContent = (content: string) => {
  // Split by common patterns but keep them
  const parts = content.split(
    /(\₹[\d,]+|\bSection\s\d+\w*\b|\[Citation|\(\w+\))/g
  );

  return parts.map((part, idx) => {
    if (/₹/.test(part)) {
      return (
        <span key={idx} className="font-mono text-teal-300">
          {part}
        </span>
      );
    }
    if (/Section\s\d+/.test(part)) {
      return (
        <span key={idx} className="text-teal-400 font-medium">
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

export const ChatScreen: React.FC = () => {
  const {
    chatHistory,
    addMessage,
    clearChat,
    userId,
    isLoading,
    setIsLoading,
    chatDocumentContext,
    setChatDocumentContext,
  } = useAppStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return;

    setError(null);
    setInput('');

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    setIsTyping(true);
    setIsLoading(true);

    try {
      const response = await queryAPI({
        query: question,
        user_id: userId,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        agent: 'tax', // This would be determined by orchestrator in real impl
        timestamp: new Date(),
      };

      addMessage(assistantMessage);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Chat error:', err);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const isEmpty = chatHistory.length === 0;

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-teal-400" />
          <span className="font-semibold text-slate-50">Tax Assistant</span>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clearChat()}
          className="text-slate-400 hover:text-slate-200"
        >
          Clear Chat
        </Button>
      </div>

      {/* Document Context Banner */}
      {chatDocumentContext && (
        <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <FileText size={16} className="text-teal-400" />
            <span className="text-slate-300">
              Document context: <span className="font-semibold text-teal-400">{chatDocumentContext.filename}</span>
            </span>
          </div>
          <button
            onClick={() => setChatDocumentContext(null)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-4">
            {isEmpty && !chatDocumentContext ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md mx-auto animate-in fade-in">
                  <Zap className="w-16 h-16 text-teal-400 mx-auto mb-6 animate-scale-in" />
                  <h2 className="text-2xl font-bold text-slate-50 mb-2">
                    Ask CA-Assist anything about Indian taxes
                  </h2>
                  <p className="text-sm text-slate-400 mb-8">
                    Every answer is cited from the Income Tax Act or GST circulars
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-300 cursor-pointer transition-colors text-left hover:border-teal-600"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : isEmpty && chatDocumentContext ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-2xl mx-auto animate-in fade-in w-full">
                  <FileText className="w-16 h-16 text-teal-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-slate-50 mb-2">
                    Document information loaded
                  </h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Here's the information extracted from your document. Ask any questions about it.
                  </p>

                  {/* Extracted Data Display */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6 text-left max-h-64 overflow-y-auto">
                    {chatDocumentContext.data && Object.entries(chatDocumentContext.data).map(([key, value]) => {
                      if (value === null || value === undefined || key === 'filename' || key === 'file_size' || key === 'chunks_added' || key === 'upload_status') return null;
                      
                      const label = key
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');

                      return (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                          <span className="text-sm text-slate-400">{label}</span>
                          <span className="text-sm font-semibold text-teal-400">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-500 mb-6">
                    Use the input below to ask questions related to this document or tax calculations.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300',
                        msg.role === 'user'
                          ? 'bg-teal-600 text-white rounded-tr-sm'
                          : 'bg-slate-800 border border-slate-700 rounded-tl-sm text-slate-200'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div>
                          <AgentBadge agent={msg.agent} />
                        </div>
                      )}
                      <div className="leading-relaxed">
                        {formatMessageContent(msg.content)}
                      </div>
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                            <BookOpen size={12} />
                            Sources
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {msg.citations.map((citation, cidx) => (
                              <CitationChip
                                key={cidx}
                                citation={citation}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] bg-slate-800 border-2 border-red-500/50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                      <p>{error}</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setError(null)}
                        className="mt-2"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            )}
          </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-slate-950 p-4 flex-shrink-0">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(input);
              }
            }}
            placeholder={chatDocumentContext ? "Ask about this document, tax implications, calculations..." : "Ask about deductions, ITR, GST, tax regime..."}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-50 placeholder-slate-500"
            rows={1}
            style={{ maxHeight: '120px' }}
          />
          <Button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="bg-teal-600 hover:bg-teal-700 rounded-xl h-full px-4"
          >
            {isLoading ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
