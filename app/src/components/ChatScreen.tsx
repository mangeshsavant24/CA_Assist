// MODIFIED: 2026-03-28 — layout restructure
// Changed: Added left sidebar (w-64) with search, upload-doc button, document list from GET /document/list,
//          two-column layout (sidebar + main), chat header with clear button, auto-consume chatContext on mount
// Preserved: All API calls (queryAPI), agent badge system, citation chips, typing indicator, message bubbles,
//            welcome state with suggested questions, all existing colors and classes

import React, { useState, useRef, useEffect } from 'react';
import {
  Scale,
  Receipt,
  Lightbulb,
  SendHorizonal,
  Loader,
  BookOpen,
  FileText,
  Zap,
  X,
  Search,
  Upload,
  File,
  Image,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useAppStore } from '../store/appStore';
import { queryAPI, listDocumentsAPI } from '../lib/api';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: 'TAX_QUERY' | 'GST_QUERY' | 'ADVISORY' | 'DOCUMENT_ANALYSIS';
  citations?: Array<{ source: string; section: string; act: string; url?: string }>;
  timestamp: Date;
}

interface DocItem {
  id: string;
  original_filename?: string;  // primary backend field
  filename?: string;           // fallback if API uses different key
  document_type?: string;
  created_at?: string;
  file_size?: number;
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
  if (agent === 'TAX_QUERY') return (
    <div className="inline-flex items-center gap-1 bg-black/30 text-[#10b981] border border-white/10 rounded-full px-2 py-0.5 text-xs font-medium mb-2">
      <Scale size={12} /> Tax Agent
    </div>
  );
  if (agent === 'GST_QUERY') return (
    <div className="inline-flex items-center gap-1 bg-black/30 text-purple-400 border border-white/10 rounded-full px-2 py-0.5 text-xs font-medium mb-2">
      <Receipt size={12} /> GST Agent
    </div>
  );
  if (agent === 'ADVISORY' || agent === 'DOCUMENT_ANALYSIS') return (
    <div className="inline-flex items-center gap-1 bg-black/30 text-amber-400 border border-white/10 rounded-full px-2 py-0.5 text-xs font-medium mb-2">
      <Lightbulb size={12} /> {agent === 'DOCUMENT_ANALYSIS' ? 'Document Analysis' : 'Advisory'} Agent
    </div>
  );
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
          <div className="mb-1"><span className="text-[#a1a1aa]">Act:</span> {citation.act}</div>
          {citation.section && <div className="mb-1"><span className="text-[#a1a1aa]">Section:</span> {citation.section}</div>}
          {citation.url && (
            <div>
              <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:underline">
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
    {[0, 150, 300].map((delay) => (
      <div key={delay} className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
    ))}
  </div>
);

const formatMessageContent = (content: string) => {
  const parts = content.split(/(₹[\d,]+|\bSection\s\d+\w*\b|\[Citation|\(\w+\))/g);
  return parts.map((part, idx) => {
    if (/₹/.test(part)) return <span key={idx} className="font-mono text-[#10b981]">{part}</span>;
    if (/Section\s\d+/.test(part)) return <span key={idx} className="text-[#10b981] font-medium">{part}</span>;
    return <span key={idx}>{part}</span>;
  });
};

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return { icon: FileText, color: 'text-red-400' }
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) return { icon: Image, color: 'text-blue-400' }
  return { icon: File, color: 'text-slate-400' }
}

function formatDocType(docType?: string) {
  if (!docType) return ''
  return docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const ChatScreen: React.FC = () => {
  const {
    chatHistory,
    addMessage,
    clearChat,
    isLoading,
    setIsLoading,
    chatDocumentContext,
    setChatDocumentContext,
    setActiveTab,
    chatContext,
    clearChatContext,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sidebar state
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docSearch, setDocSearch] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Fetch document list
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setDocsLoading(true)
        const result = await listDocumentsAPI()
        setDocs(result)
      } catch {
        setDocs([])
      } finally {
        setDocsLoading(false)
      }
    }
    fetchDocs()
  }, []);

  // Consume chatContext from home shortcut on mount
  useEffect(() => {
    if (chatContext?.pendingMessage) {
      const msg = chatContext.pendingMessage as string
      setInput(msg)
      handleSendMessage(msg)
      clearChatContext()
    } else if (chatContext?.pendingFile) {
      // Could handle file here in the future
      clearChatContext()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return;
    setError(null);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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
      const response = await queryAPI({ query: question });
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        agent: 'TAX_QUERY',
        timestamp: new Date(),
      };
      addMessage(assistantMessage);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

  const handleDocClick = (doc: DocItem) => {
    setSelectedDocId(doc.id);
    const name = doc.original_filename || doc.filename || 'this document';
    setInput(`Tell me about ${name}. What are the key financial figures?`);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const filteredDocs = docs.filter((d) => {
    const name = d.original_filename || d.filename || '';
    return name.toLowerCase().includes(docSearch.toLowerCase());
  });

  const isEmpty = chatHistory.length === 0;

  return (
    <div className="flex flex-1 min-h-0" style={{ height: 'calc(100vh - 64px)' }}>

      {/* LEFT SIDEBAR */}
      <div
        className="w-64 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(4,8,20,0.85)' }}
      >
        {/* Search + Upload */}
        <div className="p-3 space-y-2">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50"
            />
          </div>
          <button
            onClick={() => setActiveTab('document')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-slate-400 hover:text-teal-400 hover:border-teal-700 transition-all"
          >
            <Upload size={14} />
            Upload Document
          </button>
        </div>

        <div className="mx-3 my-1 border-t border-white/[0.06]" />

        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-3 py-1">
          Your Documents
        </p>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {docsLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center mt-8 px-3">
              <FileText size={20} className="text-slate-600 mx-auto mb-2" />
              <p className="text-[10px] text-slate-500">No documents yet</p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const { icon: Icon, color } = getFileIcon(doc.original_filename || doc.filename || '');
              const isSelected = selectedDocId === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => handleDocClick(doc)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150 text-left',
                    isSelected ? 'bg-teal-950' : 'hover:bg-white/5'
                  )}
                >
                  <Icon size={14} className={cn(color, 'flex-shrink-0')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs truncate', isSelected ? 'text-teal-400' : 'text-slate-300')}>
                      {doc.original_filename || doc.filename || 'Unnamed document'}
                    </p>
                    {doc.document_type && (
                      <p className="text-[10px] text-slate-500">{formatDocType(doc.document_type)}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar bottom */}
        <div className="mt-auto p-3 border-t border-white/[0.06]">
          <p className="text-[10px] text-slate-600 text-center">Documents added to AI context</p>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#0a0a0a]">

        {/* Chat Header */}
        <div
          className="h-14 flex items-center justify-between px-6 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-white">Chat</span>
            <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearChat()}
            className="text-[#a1a1aa] hover:text-white text-xs"
          >
            Clear Chat
          </Button>
        </div>

        {/* Document Context Banner */}
        {chatDocumentContext && (
          <div
            className="px-6 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center gap-2 text-sm">
              <FileText size={16} className="text-[#10b981]" />
              <span className="text-white/80">
                Document context: <span className="font-semibold text-[#10b981]">{chatDocumentContext.filename}</span>
              </span>
            </div>
            <button onClick={() => setChatDocumentContext(null)} className="text-[#a1a1aa] hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {isEmpty && !chatDocumentContext ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md mx-auto animate-in fade-in">
                  <Zap className="w-16 h-16 text-[#10b981] mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-2">Ask CA-Assist anything about Indian taxes</h2>
                  <p className="text-sm text-[#a1a1aa] mb-8">Every answer is cited from the Income Tax Act or GST circulars</p>
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
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-2xl mx-auto animate-in fade-in w-full">
                  <FileText className="w-16 h-16 text-[#10b981] mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-2">Document information loaded</h2>
                  <p className="text-sm text-[#a1a1aa] mb-6">Here's the information extracted from your document. Ask any questions about it.</p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6 text-left max-h-64 overflow-y-auto">
                    {chatDocumentContext.data && Object.entries(chatDocumentContext.data).map(([key, value]) => {
                      if (value === null || value === undefined || ['filename', 'file_size', 'chunks_added', 'upload_status'].includes(key)) return null;
                      const label = key.replace(/_/g, ' ').split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      return (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                          <span className="text-sm text-[#a1a1aa]">{label}</span>
                          <span className="text-sm font-semibold text-[#10b981]">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300',
                        msg.role === 'user'
                          ? 'max-w-[65%] ml-auto bg-[#10b981] text-white rounded-tr-sm'
                          : 'max-w-[75%] bg-black/40 border border-white/10 rounded-tl-sm text-white/90'
                      )}
                    >
                      {msg.role === 'assistant' && <div><AgentBadge agent={msg.agent} /></div>}
                      <div className="leading-relaxed">{formatMessageContent(msg.content)}</div>
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-1 text-xs text-[#a1a1aa] mb-2">
                            <BookOpen size={12} /> Sources
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {msg.citations.map((citation, cidx) => (
                              <CitationChip key={cidx} citation={citation} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] bg-black/40 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] bg-black/40 border-2 border-red-500/50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white/90">
                      <p>{error}</p>
                      <Button variant="secondary" size="sm" onClick={() => setError(null)} className="mt-2">Dismiss</Button>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div
          className="flex-shrink-0 p-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(input);
                }
              }}
              placeholder={chatDocumentContext ? 'Ask about this document, tax implications...' : 'Ask about taxes, GST, your documents...'}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600 text-white placeholder-[#a1a1aa] text-sm"
              rows={1}
              style={{ maxHeight: '120px' }}
            />
            <Button
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="bg-[#10b981] hover:bg-[#059669] rounded-xl px-4 py-3 flex-shrink-0"
            >
              {isLoading ? <Loader size={18} className="animate-spin" /> : <SendHorizonal size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
