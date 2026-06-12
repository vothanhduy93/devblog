import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logClientError } from '../services/logger';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Catch errors in any components below and re-render with error message
    logClientError(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              We encountered an unexpected error while trying to render this page. Our team has been notified.
            </p>
            
            {this.state.error && (
              <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-lg text-left overflow-x-auto mb-8 border border-zinc-200 dark:border-zinc-800">
                 <p className="font-mono text-xs text-red-600 dark:text-red-400">
                   {this.state.error.toString()}
                 </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
               >
                 <RefreshCcw className="w-4 h-4" />
                 Try Again
              </button>
              
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-full font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
               >
                 <Home className="w-4 h-4" />
                 Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
