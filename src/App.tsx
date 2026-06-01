import { Component, type ReactNode } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ChatApp from './pages/ChatApp';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null; stack: string | null }> {
  state = { error: null, stack: null };
  componentDidCatch(error: Error, info: any) {
    this.setState({ error: error.message, stack: info.componentStack });
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: 'white', background: '#09090b', padding: 20, height: '100vh', overflow: 'auto' }}>
          <h2 style={{ color: '#f87171' }}>Error: {this.state.error}</h2>
          <pre style={{ color: '#fbbf24', fontSize: 11, whiteSpace: 'pre-wrap' }}>{this.state.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <ErrorBoundary>
            <ChatApp />
          </ErrorBoundary>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
