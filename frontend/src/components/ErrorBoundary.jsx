// frontend/src/components/ErrorBoundary.jsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Frontend Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#e53e3e' }}>Something went wrong.</h2>
          <p>Please refresh the page or try logging out.</p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer' }}
          >
            Reset Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}