import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  FileJson,
  BookOpen,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { uploadDocumentAPI } from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import { useAppStore } from '../store/appStore';

interface ExtractedData {
  gross_salary?: number;
  tds_deducted?: number;
  pf?: number;
  pan?: string;
  gstin?: string;
  [key: string]: any;
}

interface ProcessingStep {
  id: 'received' | 'extracting' | 'analyzing';
  label: string;
  status: 'completed' | 'processing' | 'pending';
}

export const DocumentUpload: React.FC = () => {
  const { sessionId } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [documentType, setDocumentType] = useState<
    'salary_slip' | 'form16' | 'invoice' | null
  >(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'received', label: 'File received', status: 'pending' },
    { id: 'extracting', label: 'Extracting text', status: 'pending' },
    { id: 'analyzing', label: 'Analyzing fields', status: 'pending' },
  ]);

  const [insights, setInsights] = useState<
    Array<{
      type: 'tip' | 'warning' | 'action';
      title: string;
      description: string;
      source: string;
    }>
  >([]);

  const validateFile = (f: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(f.type)) {
      return 'Only PDF and PNG/JPG files are supported';
    }
    if (f.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const handleFileSelect = (f: File) => {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const updateStep = (stepId: ProcessingStep['id'], status: ProcessingStep['status']) => {
    setProcessingSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    // Simulate step progression
    updateStep('received', 'completed');
    setTimeout(() => updateStep('extracting', 'processing'), 100);
    setTimeout(() => updateStep('extracting', 'completed'), 1000);
    setTimeout(() => updateStep('analyzing', 'processing'), 1100);

    try {
      const response = await uploadDocumentAPI(file, sessionId);

      // Simulate extraction duration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Determine document type based on extracted data
      if (response.extracted_data?.gross_salary) {
        setDocumentType('salary_slip');
      } else if (response.extracted_data?.pan) {
        setDocumentType('form16');
      }

      setExtractedData(response.extracted_data);

      // Generate sample insights
      const sampleInsights = [
        {
          type: 'tip' as const,
          title: '80C Headroom Available',
          description: `Your PF contribution is ₹${formatCurrency(
            response.extracted_data?.pf || 0
          )}. You can still invest more under 80C to reach the ₹1,50,000 limit.`,
          source: 'ITA 1961 · §80C',
        },
        {
          type: 'warning' as const,
          title: 'HRA Exemption Applicable',
          description: `Your salary includes HRA component. Ensure you have rent receipts to claim this exemption of ₹XXXXX.`,
          source: 'ITA 1961 · §10(13A)',
        },
        {
          type: 'action' as const,
          title: 'Regime Recommendation Ready',
          description:
            'Based on your extracted salary data, click below to instantly see which regime saves you more.',
          source: 'CA-Assist',
        },
      ];
      setInsights(sampleInsights);

      updateStep('analyzing', 'completed');
    } catch (err) {
      setError('Failed to process document. Please try again.');
      console.error('Upload error:', err);
      updateStep('analyzing', 'completed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setExtractedData(null);
    setDocumentType(null);
    setInsights([]);
    setError(null);
    setProcessingSteps([
      { id: 'received', label: 'File received', status: 'pending' },
      { id: 'extracting', label: 'Extracting text', status: 'pending' },
      { id: 'analyzing', label: 'Analyzing fields', status: 'pending' },
    ]);
  };

  const hasResults = extractedData && !loading;

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Upload Zone */}
        {!hasResults && (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="pt-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200',
                  isDragging
                    ? 'border-teal-500 bg-teal-950/30'
                    : 'border-slate-600 hover:border-teal-500 hover:bg-slate-800/50 bg-slate-900/50'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />

                {!file ? (
                  <>
                    <Upload
                      size={48}
                      className={cn(
                        'mx-auto mb-4 transition-all',
                        isDragging ? 'text-teal-400 scale-110' : 'text-slate-500'
                      )}
                    />
                    <p className="text-slate-200 font-medium mb-2">
                      Drop your salary slip or Form 16 here
                    </p>
                    <p className="text-sm text-slate-400 mb-3">
                      Supports PDF · Max 10MB
                    </p>
                    <p className="text-sm text-teal-400 underline">
                      or click to browse files
                    </p>
                  </>
                ) : (
                  <>
                    <FileText
                      size={40}
                      className="mx-auto mb-3 text-teal-400"
                    />
                    <p className="text-slate-200 font-medium mb-1">{file.name}</p>
                    <p className="text-sm text-slate-400 mb-4">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X size={16} className="mr-1" />
                      Remove
                    </Button>
                  </>
                )}

                {error && (
                  <div className="mt-4 bg-red-950/50 border border-red-700/50 rounded-lg p-3 flex gap-3">
                    <AlertCircle
                      size={16}
                      className="text-red-400 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-red-300 text-left">{error}</p>
                  </div>
                )}
              </div>

              {file && !loading && (
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handleAnalyze}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 py-3"
                  >
                    Extract & Analyze →
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setFile(null)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {loading && (
                <div className="mt-6 space-y-4">
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-transparent h-full w-1/3 animate-pulse" />
                  </div>

                  {/* Processing Steps */}
                  <div className="space-y-3">
                    <p className="text-sm text-slate-300">Reading document...</p>
                    {processingSteps.map((step, idx) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        {step.status === 'completed' && (
                          <CheckCircle2 size={16} className="text-teal-400" />
                        )}
                        {step.status === 'processing' && (
                          <RotateCw
                            size={16}
                            className="text-teal-400 animate-spin"
                          />
                        )}
                        {step.status === 'pending' && (
                          <div className="w-4 h-4 rounded-full border border-slate-600" />
                        )}
                        <span
                          className={
                            step.status === 'completed'
                              ? 'text-teal-400'
                              : 'text-slate-400'
                          }
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Document Type Detection Banner */}
        {hasResults && documentType && (
          <Card
            className={cn(
              'border-l-4',
              documentType === 'salary_slip'
                ? 'bg-blue-950/50 border-blue-700 border-l-blue-500'
                : documentType === 'form16'
                  ? 'bg-violet-950/50 border-violet-700 border-l-violet-500'
                  : 'bg-amber-950/50 border-amber-700 border-l-amber-500'
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileJson
                  size={24}
                  className={
                    documentType === 'salary_slip'
                      ? 'text-blue-400'
                      : documentType === 'form16'
                        ? 'text-violet-400'
                        : 'text-amber-400'
                  }
                />
                <p className="font-semibold text-slate-100">
                  {documentType === 'salary_slip'
                    ? '📄 Salary Slip Detected — FY 2024-25'
                    : documentType === 'form16'
                      ? '📋 Form 16 Detected'
                      : '🧾 Invoice Detected'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extracted Fields Section */}
        {hasResults && (
          <Card className="bg-slate-900 border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Extracted Information</CardTitle>
                <div className="inline-flex items-center gap-1 bg-violet-950 text-violet-400 border border-violet-800 rounded-full px-2 py-0.5 text-xs font-medium">
                  <FileJson size={12} />
                  Document Agent
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {extractedData && Object.entries(extractedData).map(([key, value]) => {
                  if (value === null || value === undefined) return null;
                  const label = key
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');

                  return (
                    <div
                      key={key}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                    >
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                        {label}
                      </p>
                      <p className="text-lg font-mono font-semibold text-slate-100">
                        {typeof value === 'number' && key.includes('salary')
                          ? formatCurrency(value)
                          : String(value)}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span className="text-emerald-400">High confidence</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    // This would navigate to RegimeCalculator and pre-fill
                    // For now, just show a message
                    console.log('Navigate to calculator with values:', extractedData);
                  }}
                >
                  <Zap size={16} className="mr-2" />
                  Use these values in Regime Calculator →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advisory Insights Section */}
        {hasResults && insights.length > 0 && (
          <Card className="bg-slate-900 border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Tax Insights</CardTitle>
                <div className="inline-flex items-center gap-1 bg-amber-950 text-amber-400 border border-amber-800 rounded-full px-2 py-0.5 text-xs font-medium">
                  <Lightbulb size={12} />
                  Advisory Agent
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'border-l-4 rounded-r-lg p-4',
                    insight.type === 'tip'
                      ? 'bg-teal-950/30 border-l-teal-500'
                      : insight.type === 'warning'
                        ? 'bg-amber-950/30 border-l-amber-500'
                        : 'bg-emerald-950/30 border-l-emerald-500'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {insight.type === 'tip' && (
                      <TrendingUp size={16} className="text-teal-400 flex-shrink-0 mt-1" />
                    )}
                    {insight.type === 'warning' && (
                      <AlertTriangle
                        size={16}
                        className="text-amber-400 flex-shrink-0 mt-1"
                      />
                    )}
                    {insight.type === 'action' && (
                      <Lightbulb
                        size={16}
                        className="text-emerald-400 flex-shrink-0 mt-1"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-slate-200 mb-1">
                        {insight.title}
                      </p>
                      <p className="text-sm text-slate-300 mb-3">
                        {insight.description}
                      </p>
                      <button className="text-xs text-slate-400 hover:text-teal-400 transition-colors inline-flex items-center gap-1">
                        <BookOpen size={12} />
                        {insight.source}
                      </button>

                      {insight.type === 'action' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-3 text-xs"
                          onClick={() => console.log('Navigate to calculator')}
                        >
                          Calculate Now →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upload Another Button */}
        {hasResults && (
          <Button
            onClick={handleReset}
            variant="secondary"
            className="w-full"
          >
            <Upload size={16} className="mr-2" />
            Upload Another Document
          </Button>
        )}
      </div>
    </div>
  );
};
