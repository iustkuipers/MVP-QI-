/**
 * Root App component
 */

import React, { Component, ReactNode, useState } from 'react';
import './styles/globals.css';
import { Navigation } from './components/Navigation';

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

const OptionsSandboxLazy = React.lazy(() =>
  import('./pages/OptionsSandbox/OptionsSandbox').then(m => {
    console.log('OptionsSandbox loaded:', m);
    return { default: m.OptionsSandbox };
  }).catch(err => {
    console.error('Error loading OptionsSandbox:', err);
    throw err;
  })
);

function AppContent() {
  const [currentPage, setCurrentPage] = useState<'portfolio' | 'options'>('portfolio');

  return (
    <>
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <ErrorBoundary>
        <React.Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
          {currentPage === 'portfolio' ? (
            <BacktestPageLazy />
          ) : (
            <OptionsSandboxLazy />
          )}
        </React.Suspense>
      </ErrorBoundary>
    </>
  );
}

export function App() {
  return <AppContent />;
}

export default App;
