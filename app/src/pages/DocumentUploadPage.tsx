import { useState, useRef } from 'react'
import { uploadDocumentAPI } from '@/lib/api'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Separator from '@/components/ui/Separator'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'

export default function DocumentUploadPage() {
  const { sessionId } = useAppStore()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setError('Please select a PDF or image file (PNG, JPG)')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      const response = await uploadDocumentAPI(selectedFile, sessionId)
      setResult(response)
      setSelectedFile(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload document')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-50">Document Upload</h1>
        <p className="text-sm text-slate-400 mt-1">Upload tax documents for analysis</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl">
          {!result ? (
            <Card>
              <CardHeader>
                <CardTitle>Upload Tax Document</CardTitle>
                <CardDescription>
                  Upload PDF or image files (PNG, JPG) for AI analysis. Max 10MB.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* File Upload Area */}
                <div
                  className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    disabled={isUploading}
                  />

                  {selectedFile ? (
                    <div className="space-y-2">
                      <File className="w-12 h-12 mx-auto text-teal-400" />
                      <p className="font-medium text-slate-50">{selectedFile.name}</p>
                      <p className="text-sm text-slate-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 mx-auto text-slate-500" />
                      <div>
                        <p className="font-medium text-slate-50">Click to upload a file</p>
                        <p className="text-sm text-slate-400 mt-1">
                          or drag and drop<br />
                          PDF, PNG, or JPG (max 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Actions */}
                {selectedFile && (
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleUpload}
                      isLoading={isUploading}
                      disabled={isUploading}
                    >
                      Upload & Analyze
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedFile(null)
                        setError(null)
                      }}
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Info */}
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm text-slate-400">
                  <p className="font-semibold text-slate-300">Supported Documents:</p>
                  <ul className="space-y-1 ml-4">
                    <li>✓ Form 16 (salary income)</li>
                    <li>✓ Invoices & receipts</li>
                    <li>✓ Investment certificates</li>
                    <li>✓ Bank statements</li>
                    <li>✓ Medical bills (health insurance)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                      Analysis Complete
                    </CardTitle>
                    <CardDescription>Document processed successfully</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Analysis Result */}
                <div>
                  <h3 className="font-semibold text-slate-50 mb-3">Extracted Information</h3>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{result.answer}</p>
                  </div>
                </div>

                {/* Citations */}
                {result.citations && result.citations.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-slate-50 mb-3">References</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.citations.map((citation: string, idx: number) => (
                          <Badge key={idx} variant="citation" className="text-xs font-mono">
                            {citation}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      setResult(null)
                      setSelectedFile(null)
                      setError(null)
                    }}
                  >
                    Upload Another Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
