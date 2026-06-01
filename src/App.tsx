import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ChatApp from './pages/ChatApp';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatApp />
      </SocketProvider>
    </AuthProvider>
  );
}
