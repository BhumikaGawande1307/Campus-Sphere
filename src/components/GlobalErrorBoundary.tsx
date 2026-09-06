import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught exception:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-midnight-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-midnight-900 p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-200 dark:border-white/10 space-y-6">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Something went wrong</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                A critical error occurred while rendering this page. The engineering team has been notified.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-slate-50 dark:bg-midnight-950 rounded-xl text-left border border-slate-200/60 dark:border-white/5 overflow-auto max-h-32">
                <code className="text-[10px] text-rose-600 dark:text-rose-400 break-words font-mono">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <Button onClick={this.handleReload} className="w-full" size="lg" leftIcon={<RefreshCw className="h-4 w-4" />}>
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
