import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  typingUsers: Record<number, { userId: number; userName: string }>;
  emitTyping: (conversationId: number, userName: string) => void;
  emitStopTyping: (conversationId: number) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  typingUsers: {},
  emitTyping: () => {},
  emitStopTyping: () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, { userId: number; userName: string }>>({});
  const typingTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const newSocket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('typing:start', (data: { userId: number; userName: string }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.userId]: { userId: data.userId, userName: data.userName },
      }));
    });

    newSocket.on('typing:stop', (data: { userId: number }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  const emitTyping = (conversationId: number, userName: string) => {
    if (socket?.connected) {
      socket.emit('typing:start', { conversationId, userName });

      if (typingTimeoutRef.current[conversationId]) {
        clearTimeout(typingTimeoutRef.current[conversationId]);
      }

      typingTimeoutRef.current[conversationId] = setTimeout(() => {
        emitStopTyping(conversationId);
      }, 3000);
    }
  };

  const emitStopTyping = (conversationId: number) => {
    if (socket?.connected) {
      socket.emit('typing:stop', { conversationId });
      if (typingTimeoutRef.current[conversationId]) {
        clearTimeout(typingTimeoutRef.current[conversationId]);
        delete typingTimeoutRef.current[conversationId];
      }
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, typingUsers, emitTyping, emitStopTyping }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
