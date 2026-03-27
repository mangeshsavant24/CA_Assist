import React, { useState, useEffect } from 'react';
import {
  Download,
  Trash2,
  FolderOpen,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface Document {
  id: string;
  original_filename: string;
  file_size: number;
  uploaded_at: string;
}

interface DocumentListProps {
  refreshTrigger?: number;
}

const formatFileSize = (bytes: number): string => {
  return Math.round(bytes / 1024);
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-IN');
};

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 animate-pulse"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            <div className="h-3 bg-slate-700 rounded w-1/3"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-slate-700 rounded"></div>
            <div className="h-8 w-8 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const DocumentList: React.FC<DocumentListProps> = ({ refreshTrigger = 0 }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/documents/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const handleDownload = (docId: string, filename: string) => {
    const token = localStorage.getItem('auth_token');
    const url = `/api/documents/download/${docId}`;
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Add auth header via fetch for better control
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch((err) => {
        console.error('Download failed:', err);
      });
  };

  const handleDeleteClick = (docId: string) => {
    setConfirmDeleteId(docId);
  };

  const handleConfirmDelete = async (docId: string) => {
    try {
      setDeletingId(docId);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Remove from UI with animation
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      setConfirmDeleteId(null);
      
      // Show toast (you could use a toast library here)
      console.log('Document deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  if (error) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-slate-200">
              My Documents
            </CardTitle>
            <div className="inline-flex items-center bg-slate-700 text-slate-300 text-xs rounded-full px-2 py-0.5">
              {documents.length}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <LoadingSkeleton />
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen size={32} className="mx-auto mb-4 text-slate-500" />
            <p className="text-slate-200 mb-2 font-medium">No documents uploaded yet</p>
            <p className="text-sm text-slate-400">Upload a salary slip or Form 16 above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  'bg-slate-800 border border-slate-700 rounded-lg px-4 py-3',
                  'hover:border-slate-600 transition-colors',
                  confirmDeleteId === doc.id ? 'ring-2 ring-red-500/50' : ''
                )}
              >
                {confirmDeleteId === doc.id ? (
                  <div className="flex items-center justify-between bg-red-950/20 border border-red-700/30 rounded-md p-3">
                    <span className="text-sm text-red-300">Delete this file?</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelDelete}
                        className="text-slate-300 hover:text-slate-100"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmDelete(doc.id)}
                        className="bg-red-700 hover:bg-red-800 text-white"
                        disabled={deletingId === doc.id}
                      >
                        {deletingId === doc.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <FileText size={16} className="text-teal-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 font-medium truncate max-w-xs">
                          {doc.original_filename}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatFileSize(doc.file_size)} KB · Uploaded {formatRelativeTime(doc.uploaded_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex gap-2 ml-4">
                      <button
                        onClick={() => handleDownload(doc.id, doc.original_filename)}
                        className={cn(
                          'p-2 rounded-md border border-slate-600',
                          'bg-slate-700 hover:bg-teal-700',
                          'transition-colors text-slate-400 hover:text-teal-300',
                          'flex-shrink-0'
                        )}
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(doc.id)}
                        className={cn(
                          'p-2 rounded-md border border-slate-600',
                          'bg-slate-700 hover:bg-red-900 hover:border-red-700',
                          'transition-colors text-slate-400 hover:text-red-400',
                          'flex-shrink-0'
                        )}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
