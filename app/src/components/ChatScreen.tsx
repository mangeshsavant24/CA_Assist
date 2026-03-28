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
  agent?: 'TAX_QUERY' | 'GST_QUERY' | 'ADVISORY' | 'DOCUMENT_ANALYSIS';
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
  if (agent === 'TAX_QUERY') {
    return (

<div className="inline-flex items-center gap-1 bg-black/30 text-[#10b981] border border-white/10 rounded-full px-2 py-0.5 text-xs font-medium mb-2">
        <Scale size={12} />
        Tax Agent
      </div>
    );
  }
  if (agent === 'GST_QUERY') {
    return (
      <div className="inline-flex items-center gap-1 bg-black/30 text-purple-400 border border-white/10 rounded-full px-2 py-0.5 text-xs font-medium mb-2">
        <Receipt size={12} />
        GST Agent
      </div>
    );
  }
  if (agent === 'ADVISORY' || agent === 'DOCUMENT_ANALYSIS') {
    return (
      <div className="inline-flex items-center gap-1 bg-black/30 text-amber-400 border border-white/10 rounded-full px-2 py-0.5 text-xs font-medium mb-2">
        <Lightbulb size={12} />
        {agent === 'DOCUMENT_ANALYSIS' ? 'Document Analysis' : 'Advisory'} Agent
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
        className="bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-xs text-[#a1a1aa] hover:border-emerald-600/50 hover:text-[#10b981] transition-colors inline-flex items-center gap-1.5"
      >
        <FileText size={12} />
        {citation.section ? `ITA 1961 · §${citation.section}` : citation.source}
      </button>
      {expanded && (
        <div className="bg-black/40 border border-emerald-600/30 rounded-lg p-3 mt-2 text-xs text-white/80 border-l-2 border-l-emerald-600">
          <div className="mb-1">
            <span className="text-[#a1a1aa]">Act:</span> {citation.act}
          </div>
          {citation.section && (
            <div className="mb-1">
              <span className="text-[#a1a1aa]">Section:</span> {citation.section}
            </div>
          )}
          {citation.url && (
            <div>
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#10b981] hover:underline"
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
      className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
      style={{ animationDelay: '0ms' }}
    />
    <div
      className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
      style={{ animationDelay: '150ms' }}
    />
    <div
      className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
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
        <span key={idx} className="font-mono text-[#10b981]">
          {part}
        </span>
      );
    }
    if (/Section\s\d+/.test(part)) {
      return (
        <span key={idx} className="text-[#10b981] font-medium">
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
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        agent: 'TAX_QUERY', // This would be determined by orchestrator in real impl
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
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 backdrop-blur-2xl bg-black/20">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#10b981]" />
          <span className="font-semibold text-white">Tax Assistant</span>
          <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clearChat()}
          className="text-[#a1a1aa] hover:text-white"
        >
          Clear Chat
        </Button>
      </div>

      {/* Document Context Banner */}
      {chatDocumentContext && (
        <div className="border-b border-white/5 bg-black/30 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <FileText size={16} className="text-[#10b981]" />
            <span className="text-white/80">
              Document context: <span className="font-semibold text-[#10b981]">{chatDocumentContext.filename}</span>
            </span>
          </div>
          <button
            onClick={() => setChatDocumentContext(null)}
            className="text-[#a1a1aa] hover:text-white transition-colors"
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
                  <Zap className="w-16 h-16 text-[#10b981] mx-auto mb-6 animate-scale-in" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Ask CA-Assist anything about Indian taxes
                  </h2>
                  <p className="text-sm text-[#a1a1aa] mb-8">
                    Every answer is cited from the Income Tax Act or GST circulars
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-sm text-[#a1a1aa] cursor-pointer transition-colors text-left hover:border-emerald-600/50"
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
                  <FileText className="w-16 h-16 text-[#10b981] mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Document information loaded
                  </h2>
                  <p className="text-sm text-[#a1a1aa] mb-6">
                    Here's the information extracted from your document. Ask any questions about it.
                  </p>

                  {/* Extracted Data Display */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6 text-left max-h-64 overflow-y-auto">
                    {chatDocumentContext.data && Object.entries(chatDocumentContext.data).map(([key, value]) => {
                      if (value === null || value === undefined || key === 'filename' || key === 'file_size' || key === 'chunks_added' || key === 'upload_status') return null;
                      
                      const label = key
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');

                      return (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                          <span className="text-sm text-[#a1a1aa]">{label}</span>
                          <span className="text-sm font-semibold text-[#10b981]">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-[#a1a1aa] mb-6">
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
                          ? 'bg-[#10b981] text-white rounded-tr-sm'
                          : 'bg-black/40 border border-white/10 rounded-tl-sm text-white/90'
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
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-1 text-xs text-[#a1a1aa] mb-2">
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
                    <div className="max-w-[70%] bg-black/40 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] bg-black/40 border-2 border-red-500/50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white/90">
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
      <div className="border-t border-white/5 bg-[#0a0a0a] p-4 flex-shrink-0">
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
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600 text-white placeholder-[#a1a1aa]"
            rows={1}
            style={{ maxHeight: '120px' }}
          />
          <Button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="bg-[#10b981] hover:bg-[#059669] rounded-xl h-full px-4"
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
