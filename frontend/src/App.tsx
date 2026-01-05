/**
 * Root App component
 */

import React, { Component, ReactNode } from 'react';
import './styles/globals.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'monospace', color: 'red' }}>
          <h1>Error Loading App</h1>
          <pre>{this.state.error?.toString()}\n\n{this.state.error?.stack}</pre>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const BacktestPageLazy = React.lazy(() => 
  import('./pages/BacktestPage/BacktestPage').then(m => {
    console.log('BacktestPage loaded:', m);
    return { default: m.BacktestPage };
  }).catch(err => {
    console.error('Error loading BacktestPage:', err);
    throw err;
  })
);

export function App() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div style={{ padding: '20px' }}>Loading BacktestPage...</div>}>
        <BacktestPageLazy />
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default App;
