import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🔥 UI Crash:", error, errorInfo);
    
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const payload = {
        message: error.message || 'Unknown Error',
        stack: error.stack,
        route: window.location.pathname,
        component: errorInfo.componentStack,
        user: user ? { id: user._id || user.id, email: user.email, role: user.role } : null,
        browser: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      };

      fetch('/api/logs/frontend-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(e => console.error('Logging failed', e));
    } catch (e) {
      console.error('Error in ErrorBoundary logger', e);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0f172a",
          color: "white",
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{ textAlign: "center", padding: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "30px", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h1 style={{ fontSize: 32, marginBottom: 15, fontWeight: 900, tracking: "-0.05em" }}>
              Something went wrong
            </h1>

            <p style={{ opacity: 0.6, marginBottom: 30, fontSize: 16, maxWidth: "300px" }}>
              We’ve encountered a technical hiccup. Our team has been notified.
            </p>

            <button
              onClick={this.handleReload}
              style={{
                padding: "16px 32px",
                background: "#2563eb",
                border: "none",
                borderRadius: "15px",
                color: "white",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                boxShadow: "0 10px 30px rgba(37,99,235,0.3)",
                transition: "all 0.2s"
              }}
            >
              Reload System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
