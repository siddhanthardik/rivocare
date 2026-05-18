import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('[GLOBAL_ERROR_BOUNDARY]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.state.error?.message?.includes('user is not defined')) {
        return <div className="p-6">Session loading...</div>;
      }

      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">!</div>
            <h1 className="text-xl font-black text-slate-900">Something went wrong</h1>
            <p className="text-sm text-slate-500 font-bold">The application encountered an unexpected error. Please try reloading the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
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

export default ErrorBoundary;
