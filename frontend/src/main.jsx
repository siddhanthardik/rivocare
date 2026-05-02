import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

// ── Global Error Catch-all ────────────────────────────────────
window.onerror = function (msg, url, line, col, error) {
  console.error("Global Error Captured:", msg);
  const payload = {
    message: msg,
    stack: error?.stack || `At ${url}:${line}:${col}`,
    route: window.location.pathname,
    browser: { userAgent: navigator.userAgent, platform: navigator.platform }
  };
  fetch('/api/logs/frontend-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(e => {});
};

window.onunhandledrejection = function (event) {
  console.error("Unhandled Promise Rejection:", event.reason);
  const payload = {
    message: event.reason?.message || "Unhandled Promise Rejection",
    stack: event.reason?.stack || "No stack trace available",
    route: window.location.pathname,
    browser: { userAgent: navigator.userAgent, platform: navigator.platform }
  };
  fetch('/api/logs/frontend-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(e => {});
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ErrorBoundary>
            <App />
            <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' } }} />
          </ErrorBoundary>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
