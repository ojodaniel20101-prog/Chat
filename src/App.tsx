import { Component, type ReactNode } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ChatApp from './pages/ChatApp';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  componentDidCatch(error: Error) {
    this.setState({ error: error.message });
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: 'white', background: '#09090b', padding: 20, height: '100vh' }}>
          <h2>Error</h2>
          <pre style={{ color: '#f87171', whiteSpace: 'pre-wrap' }}>{this.state.error}</pre>
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
