import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scale, Receipt, Lightbulb, SendHorizonal, Loader,
  BookOpen, FileText, Zap, X, Search, Upload, File,
  Image, Trash2, ExternalLink, ChevronRight,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useAppStore } from '../store/appStore';
import { queryAPI, listDocumentsAPI, uploadDocumentAPI } from '../lib/api';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: 'TAX_QUERY' | 'GST_QUERY' | 'ADVISORY' | 'DOCUMENT_ANALYSIS';
  citations?: Array<{ source: string; section: string; act: string; url?: string }>;
  timestamp: Date;
  /** If set, show an action button that navigates to a feature tab */
  actionTab?: string;
  actionLabel?: string;
}

interface DocItem {
  id: string;
  original_filename?: string;
  filename?: string;
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

/* ─── Intent detection helpers ─── */

/** Keywords that signal the user wants the regime calculator */
const REGIME_INTENT = [
  /regime\s*(calc|engine|calculat)/i,
  /tax\s*(calc|comp)/i,
  /use\s+(the\s+)?(extracted|doc|document|these)\s+values?\s+in\s+regime/i,
  /compare\s+(old|new)\s+(and|vs|or)\s+(old|new)/i,
  /import\s+.+\s+regime/i,
  /put\s+.+\s+(into|in)\s+regime/i,
  /regime\s+calc/i,
  /use\s+.+\s+for\s+regime/i,
];

const FOREX_INTENT = [
  /forex\s*(calc|engine|val)/i,
  /use\s+(the\s+)?(extracted|doc|document|these)\s+values?\s+in\s+forex/i,
  /import\s+.+\s+forex/i,
  /foreign\s+(exchange|currency)\s+(calc|engine)/i,
];

const FUND_INTENT = [
  /fund\s*(acc|calc|nav)/i,
  /use\s+(the\s+)?(extracted|doc|document|these)\s+values?\s+in\s+fund/i,
  /import\s+.+\s+fund/i,
];

const CAPITAL_INTENT = [
  /capital\s*(budget|calc)/i,
  /use\s+(the\s+)?(extracted|doc|document|these)\s+values?\s+in\s+capital/i,
  /npv|irr|payback/i,
  /import\s+.+\s+capital/i,
];

type TargetTab = 'regime' | 'forex' | 'fund' | 'capital';

function detectIntent(query: string): TargetTab | null {
  if (REGIME_INTENT.some((r) => r.test(query))) return 'regime';
  if (FOREX_INTENT.some((r) => r.test(query))) return 'forex';
  if (FUND_INTENT.some((r) => r.test(query))) return 'fund';
  if (CAPITAL_INTENT.some((r) => r.test(query))) return 'capital';
  return null;
}

const TAB_LABELS: Record<TargetTab, string> = {
  regime: 'Regime Calculator',
  forex: 'Forex Valuation',
  fund: 'Fund Accounting',
  capital: 'Capital Budgeting',
};

/* ─── Sub-components ─── */

const AgentBadge = ({ agent }: { agent?: string }) => {
  if (agent === 'TAX_QUERY') return (
    <span className="inline-flex items-center gap-1 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 rounded-full px-2 py-0.5 text-[11px] font-medium mb-2">
      <Scale size={10} /> Tax Agent
    </span>
  );
  if (agent === 'GST_QUERY') return (
    <span className="inline-flex items-center gap-1 bg-purple-950/60 text-purple-400 border border-purple-800/50 rounded-full px-2 py-0.5 text-[11px] font-medium mb-2">
      <Receipt size={10} /> GST Agent
    </span>
  );
  if (agent === 'ADVISORY' || agent === 'DOCUMENT_ANALYSIS') return (
    <span className="inline-flex items-center gap-1 bg-amber-950/60 text-amber-400 border border-amber-800/50 rounded-full px-2 py-0.5 text-[11px] font-medium mb-2">
      <Lightbulb size={10} /> {agent === 'DOCUMENT_ANALYSIS' ? 'Document Analysis' : 'Advisory'} Agent
    </span>
  );
  return null;
};

const CitationChip = ({ citation }: { citation: any }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="bg-black/30 border border-white/10 rounded-md px-2.5 py-1 text-[11px] text-slate-400 hover:border-emerald-700/50 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
      >
        <FileText size={10} />
        {citation.section ? `§${citation.section}` : (citation.source || 'Source')}
      </button>
      {expanded && (
        <div className="bg-black/40 border border-emerald-800/40 border-l-2 border-l-emerald-600 rounded-lg p-3 mt-2 text-xs text-white/75 space-y-1">
          {citation.act && <div><span className="text-slate-400">Act: </span>{citation.act}</div>}
          {citation.section && <div><span className="text-slate-400">Section: </span>{citation.section}</div>}
          {citation.url && <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">View Source</a>}
        </div>
      )}
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-1.5 py-1">
    {[0, 150, 300].map((delay) => (
      <div key={delay} className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
    ))}
  </div>
);

const formatMessageContent = (content: string) => {
  const parts = content.split(/(₹[\d,]+|\bSection\s\d+\w*\b)/g);
  return parts.map((part, idx) => {
    if (/₹/.test(part)) return <span key={idx} className="font-mono text-emerald-400 font-semibold">{part}</span>;
    if (/Section\s\d+/.test(part)) return <span key={idx} className="text-emerald-400 font-medium">{part}</span>;
    return <span key={idx}>{part}</span>;
  });
};

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { icon: FileText, color: 'text-red-400' };
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) return { icon: Image, color: 'text-blue-400' };
  return { icon: File, color: 'text-slate-400' };
}

function formatDocType(docType?: string) {
  if (!docType) return '';
  return docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Delete doc via API ─── */
async function deleteDocumentAPI(docId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000'}/document/${docId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ─── Main Component ─── */
export const ChatScreen: React.FC = () => {
  const {
    chatHistory, addMessage, updateMessage, clearChat,
    isLoading, setIsLoading,
    chatDocumentContext, setChatDocumentContext,
    setActiveTab, setDocumentExtractedData,
    chatContext, clearChatContext,
    setRegimeAutofill, setForexAutofill, setFundAutofill,
    documentExtractedData,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploadingContext, setIsUploadingContext] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Sidebar */
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docSearch, setDocSearch] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const refreshDocs = useCallback(async () => {
    try {
      setDocsLoading(true);
      const result = await listDocumentsAPI();
      setDocs(result);
    } catch {
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => { refreshDocs(); }, [refreshDocs]);

  /* Consume chatContext from home strip */
  useEffect(() => {
    if (chatContext?.pendingMessage || chatContext?.pendingFile) {
      const msg = chatContext.pendingMessage as string | undefined;
      const file = chatContext.pendingFile as File | undefined;
      clearChatContext();
      
      const processHomeSubmit = async () => {
        if (file) {
          setIsUploadingContext(true);
          try {
            const { userId } = useAppStore.getState();
            await uploadDocumentAPI(file, userId);
            await refreshDocs();
          } catch (error) {
            console.error('Failed to upload document from home screen', error);
            setError('Failed to upload document.');
          } finally {
            setIsUploadingContext(false);
          }
        }
        
        if (msg) {
          const stateHistory = useAppStore.getState().chatHistory;
          const alreadySent = stateHistory.some(
            (h) => h.role === 'user' && h.content === msg && (Date.now() - new Date(h.timestamp).getTime() < 1000)
          );
          
          if (!alreadySent) {
            handleSendMessage(msg);
          }
        }
      };
      
      processHomeSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatContext?.pendingMessage, chatContext?.pendingFile]);

  /* Auto-scroll */
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [chatHistory, isTyping]);

  /* ─── Intent-aware send ─── */
  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return;
    setError(null);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    addMessage(userMsg);

    /* Check if user wants to use doc data in a tool */
    const intent = detectIntent(question);
    if (intent && (chatDocumentContext?.data || documentExtractedData)) {
      const data = chatDocumentContext?.data || documentExtractedData || {};

      // Pre-fill the appropriate autofill store
      if (intent === 'regime') setRegimeAutofill(data);
      if (intent === 'forex') setForexAutofill(data);
      if (intent === 'fund') setFundAutofill(data);
      // capital uses setDocumentExtractedData convention
      if (intent === 'capital') setDocumentExtractedData(data);

      const actionMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've pre-filled the **${TAB_LABELS[intent]}** with values from your document. Click the button below to open it — the fields will be loaded automatically.`,
        agent: 'ADVISORY',
        timestamp: new Date(),
        actionTab: intent,
        actionLabel: `Open ${TAB_LABELS[intent]} →`,
      };
      addMessage(actionMsg);
      return;
    }

    setIsTyping(true);
    setIsLoading(true);
    
    try {
      // Build history from previous messages
      const history = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const response = await queryAPI({ 
        query: question,
        history: history.length > 0 ? history : undefined
      });
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        agent: 'TAX_QUERY',
        timestamp: new Date(),
      };
      addMessage(assistantMsg);
      
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

  const handleDeleteDoc = async (docId: string) => {
    setDeletingDocId(docId);
    const ok = await deleteDocumentAPI(docId);
    if (ok) {
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDocId === docId) setSelectedDocId(null);
    }
    setDeletingDocId(null);
    setConfirmDeleteId(null);
  };

  const filteredDocs = docs.filter((d) => {
    const name = d.original_filename || d.filename || '';
    return name.toLowerCase().includes(docSearch.toLowerCase());
  });

  const isEmpty = chatHistory.length === 0;

  return (
    <div className="flex flex-1 min-h-0 h-full overflow-hidden">

      {/* ── LEFT SIDEBAR ── */}
      <div
        className="w-60 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(3,6,16,0.9)' }}
      >
        {/* Search + Upload */}
        <div className="p-3 space-y-2 flex-shrink-0">
          <div className="relative">
            <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <input
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#10b981]/40"
            />
          </div>
          <button
            onClick={() => setActiveTab('document')}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs text-slate-500 hover:text-teal-400 hover:border-teal-800/60 transition-all"
          >
            <Upload size={12} /> Upload Document
          </button>
        </div>

        <div className="mx-3 border-t border-white/[0.05]" />

        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider px-3 py-2 flex-shrink-0">
          Your Documents
        </p>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-2">
          {docsLoading ? (
            <div className="space-y-1.5 p-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-lg bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center mt-10 px-3">
              <FileText size={18} className="text-slate-700 mx-auto mb-2" />
              <p className="text-[10px] text-slate-600">No documents yet</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredDocs.map((doc) => {
                const docName = doc.original_filename || doc.filename || 'Unnamed document';
                const { icon: Icon, color } = getFileIcon(docName);
                const isSelected = selectedDocId === doc.id;
                const isConfirming = confirmDeleteId === doc.id;
                const isDeleting = deletingDocId === doc.id;

                if (isConfirming) {
                  return (
                    <div key={doc.id} className="mx-1 my-0.5 bg-red-950/40 border border-red-800/40 rounded-lg px-2 py-2">
                      <p className="text-[10px] text-red-300 mb-1.5">Delete this file?</p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 text-[10px] py-1 rounded-md bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
                        >Cancel</button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          disabled={isDeleting}
                          className="flex-1 text-[10px] py-1 rounded-md bg-red-800/60 text-red-200 hover:bg-red-700/60 transition-colors"
                        >{isDeleting ? '…' : 'Delete'}</button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={doc.id}
                    className={cn(
                      'group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-150',
                      isSelected ? 'bg-teal-950/60' : 'hover:bg-white/[0.04]'
                    )}
                  >
                    {/* Click area */}
                    <button
                      onClick={() => handleDocClick(doc)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <Icon size={13} className={cn(color, 'flex-shrink-0')} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs truncate leading-tight', isSelected ? 'text-teal-300' : 'text-slate-300')}>
                          {docName}
                        </p>
                        {doc.document_type && (
                          <p className="text-[10px] text-slate-600 leading-tight mt-0.5">{formatDocType(doc.document_type)}</p>
                        )}
                      </div>
                    </button>

                    {/* Action icons — visible on hover */}
                    <div className="flex-shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDocClick(doc)}
                        title="Ask about this document"
                        className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-teal-400 transition-colors"
                      >
                        <ChevronRight size={11} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(doc.id)}
                        title="Delete document"
                        className="p-1 rounded hover:bg-red-950/60 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-auto p-2.5 border-t border-white/[0.05] flex-shrink-0">
          <p className="text-[9px] text-slate-700 text-center tracking-wide">Hover a document for actions</p>
        </div>
      </div>

      {/* ── MAIN CHAT ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0" style={{ background: '#07090f' }}>

        {/* Header */}
        <div
          className="h-12 flex items-center justify-between px-6 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-slate-100">Chat</span>
            <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse" />
          </div>
          <button
            onClick={() => clearChat()}
            className="text-[11px] text-slate-600 hover:text-slate-300 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
          >
            Clear Chat
          </button>
        </div>

        {/* Document Context Banner */}
        {chatDocumentContext && (
          <div
            className="px-5 py-2 flex items-center justify-between flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(16,185,129,0.04)' }}
          >
            <div className="flex items-center gap-2 text-xs">
              <FileText size={13} className="text-emerald-500" />
              <span className="text-slate-400">
                Context: <span className="font-medium text-emerald-400">{chatDocumentContext.filename}</span>
              </span>
            </div>
            <button onClick={() => setChatDocumentContext(null)} className="text-slate-600 hover:text-slate-300 transition-colors ml-3">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5">
          <div className="max-w-3xl mx-auto space-y-5">
            {isUploadingContext ? (
              <div className="flex flex-col items-center justify-center min-h-[380px]">
                <Loader className="w-10 h-10 text-[#10b981] animate-spin mb-4" />
                <h2 className="text-xl font-bold text-slate-100 mb-2">Processing document...</h2>
                <p className="text-sm text-slate-500">Extracting financial data and analyzing context</p>
              </div>
            ) : isEmpty && !chatDocumentContext ? (
              <div className="flex items-center justify-center min-h-[380px]">
                <div className="text-center max-w-sm mx-auto">
                  <Zap className="w-12 h-12 text-[#10b981] mx-auto mb-5 opacity-80" />
                  <h2 className="text-xl font-bold text-slate-100 mb-2">Ask CA-Assist anything</h2>
                  <p className="text-sm text-slate-500 mb-7">Cited answers from the Income Tax Act and GST circulars</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-400 cursor-pointer transition-colors text-left hover:border-emerald-800/50 hover:text-slate-300"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : isEmpty && chatDocumentContext ? (
              <div className="flex items-center justify-center min-h-[380px]">
                <div className="text-center max-w-xl mx-auto w-full">
                  <FileText className="w-12 h-12 text-emerald-500 mx-auto mb-5" />
                  <h2 className="text-xl font-bold text-slate-100 mb-1">Document context loaded</h2>
                  <p className="text-sm text-slate-500 mb-5">Ask anything about the document below</p>
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 mb-5 text-left max-h-56 overflow-y-auto divide-y divide-white/5">
                    {chatDocumentContext.data && Object.entries(chatDocumentContext.data).map(([key, value]) => {
                      if (value === null || value === undefined || ['filename', 'file_size', 'chunks_added', 'upload_status'].includes(key)) return null;
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                      return (
                        <div key={key} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                          <span className="text-xs text-slate-500">{label}</span>
                          <span className="text-xs font-mono font-semibold text-emerald-400">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {(chatHistory as Message[]).map((msg, idx) => (
                  <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'rounded-2xl text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'max-w-[60%] px-4 py-3 bg-[#10b981] text-white rounded-tr-sm'
                          : 'max-w-[80%] px-4 py-3.5 rounded-tl-sm text-slate-200'
                      )}
                      style={msg.role === 'assistant' ? {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      } : {}}
                    >
                      {msg.role === 'assistant' && <AgentBadge agent={msg.agent} />}
                      <div className="leading-7">{formatMessageContent(msg.content)}</div>

                      {/* Action button for intent-detected responses */}
                      {msg.actionTab && (
                        <button
                          onClick={() => setActiveTab(msg.actionTab as any)}
                          className="mt-3 inline-flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold rounded-lg px-3 py-2 transition-colors"
                        >
                          <ExternalLink size={12} />
                          {msg.actionLabel || `Open ${msg.actionTab}`}
                        </button>
                      )}

                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/[0.07]">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
                            <BookOpen size={11} /> Sources
                          </div>
                          <div className="flex flex-wrap gap-1.5">
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
                    <div
                      className="rounded-2xl rounded-tl-sm px-4 py-3"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200 border border-red-800/50 bg-red-950/30">
                      <p>{error}</p>
                      <button onClick={() => setError(null)} className="text-[11px] text-slate-500 hover:text-slate-300 mt-2 transition-colors">Dismiss</button>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div
          className="flex-shrink-0 px-5 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="max-w-3xl mx-auto flex gap-2.5 items-end">
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
              placeholder={chatDocumentContext ? 'Ask about this document or type "use in regime calculator"…' : 'Ask about taxes, GST, your documents…'}
              className="flex-1 bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-700/60 text-slate-100 placeholder-slate-600 text-sm"
              rows={1}
              style={{ maxHeight: '120px' }}
            />
            <Button
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="bg-[#10b981] hover:bg-[#059669] rounded-xl px-4 py-2.5 flex-shrink-0"
            >
              {isLoading ? <Loader size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
