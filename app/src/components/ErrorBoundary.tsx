import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[ErrorBoundary] Caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error details:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050505',
          color: '#fff',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>⚠️ Application Error</h1>
            <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '20px', fontFamily: 'monospace' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <details style={{
              textAlign: 'left',
              backgroundColor: '#0a0a0a',
              padding: '15px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '12px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px', color: '#10b981' }}>
                Stack Trace
              </summary>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                backgroundColor: '#10b981',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
