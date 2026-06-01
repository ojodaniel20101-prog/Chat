import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/chat/Sidebar';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import RightPanel from '../components/chat/RightPanel';
import AuthModal from '../components/modals/AuthModal';
import ProfileModal from '../components/modals/ProfileModal';
import NewGroupModal from '../components/modals/NewGroupModal';
import UserSearchModal from '../components/modals/UserSearchModal';

export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name: string;
  avatar: string | null;
  status: string | null;
  lastSeen: string | null;
  participants: Array<{
    id: number;
    displayName: string;
    avatar: string | null;
    status: string;
    role: string;
  }>;
  lastMessage: {
    id: number;
    content: string;
    senderName: string;
    createdAt: string;
    type: string;
  } | null;
  unreadCount: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  type: 'text' | 'image' | 'file';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  edited: boolean;
  edited_at: string | null;
  deleted: boolean;
  created_at: string;
  sender?: {
    id: number;
    displayName: string;
    avatar: string | null;
  };
  reactions?: Array<{
    id: number;
    user_id: number;
    emoji: string;
    user?: {
      id: number;
      displayName: string;
    };
  }>;
  read_by?: string;
}

export default function ChatApp() {
  const { user, token } = useAuth();
  const { socket, connected, typingUsers, emitTyping } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch conversations
  useEffect(() => {
    if (!token) return;
    fetchConversations();
  }, [token]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get('/api/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;
    fetchMessages(activeConversation.id);

    // Join socket room
    if (socket) {
      socket.emit('conversation:join', activeConversation.id);
    }

    setShowRightPanel(false);

    return () => {
      if (socket && activeConversation) {
        socket.emit('conversation:leave', activeConversation.id);
      }
    };
  }, [activeConversation?.id]);

  const fetchMessages = async (conversationId: number) => {
    setMessagesLoading(true);
    try {
      const res = await axios.get(`/api/conversations/${conversationId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      // Update conversations list
      setConversations((prev) => {
        return prev.map((c) => {
          if (c.id === message.conversation_id) {
            return {
              ...c,
              lastMessage: {
                id: message.id,
                content: message.content,
                senderName: message.sender?.displayName || '',
                createdAt: message.created_at,
                type: message.type,
              },
            };
          }
          return c;
        });
      });
    };

    const handleEditedMessage = (message: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, ...message } : m))
      );
    };

    const handleDeletedMessage = (data: { messageId: number }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, deleted: true, content: '' } : m
        )
      );
    };

    const handleReactionUpdate = (data: {
      messageId: number;
      userId: number;
      emoji: string;
      action: 'added' | 'removed';
    }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === data.messageId) {
            const reactions = m.reactions || [];
            if (data.action === 'added') {
              return {
                ...m,
                reactions: [...reactions, { id: Date.now(), user_id: data.userId, emoji: data.emoji }],
              };
            } else {
              return {
                ...m,
                reactions: reactions.filter(
                  (r) => !(r.user_id === data.userId && r.emoji === data.emoji)
                ),
              };
            }
          }
          return m;
        })
      );
    };

    const handleReadUpdate = (data: { messageId: number; readBy: number[] }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, read_by: JSON.stringify(data.readBy) } : m
        )
      );
    };

    socket.on('message:receive', handleNewMessage);
    socket.on('message:edited', handleEditedMessage);
    socket.on('message:deleted', handleDeletedMessage);
    socket.on('reaction:update', handleReactionUpdate);
    socket.on('message:read_update', handleReadUpdate);

    return () => {
      socket.off('message:receive', handleNewMessage);
      socket.off('message:edited', handleEditedMessage);
      socket.off('message:deleted', handleDeletedMessage);
      socket.off('reaction:update', handleReactionUpdate);
      socket.off('message:read_update', handleReadUpdate);
    };
  }, [socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(
    (content: string, type: 'text' | 'image' | 'file' = 'text', fileData?: { fileUrl: string; fileName: string; fileSize: number }) => {
      if (!socket?.connected || !activeConversation) return;

      socket.emit('message:send', {
        conversationId: activeConversation.id,
        content,
        type,
        fileUrl: fileData?.fileUrl,
        fileName: fileData?.fileName,
        fileSize: fileData?.fileSize,
      });

      // Mark as read locally for sender
      socket.emit('typing:stop', { conversationId: activeConversation.id });
    },
    [socket, activeConversation]
  );

  const handleTyping = useCallback(() => {
    if (!activeConversation || !user) return;
    emitTyping(activeConversation.id, user.displayName);
  }, [activeConversation, user]);

  const handleEditMessage = useCallback(
    (messageId: number, content: string) => {
      if (!socket?.connected || !activeConversation) return;
      socket.emit('message:edit', {
        messageId,
        conversationId: activeConversation.id,
        content,
      });
    },
    [socket, activeConversation]
  );

  const handleDeleteMessage = useCallback(
    (messageId: number) => {
      if (!socket?.connected || !activeConversation) return;
      socket.emit('message:delete', {
        messageId,
        conversationId: activeConversation.id,
      });
    },
    [socket, activeConversation]
  );

  const handleReaction = useCallback(
    (messageId: number, emoji: string) => {
      if (!socket?.connected || !activeConversation) return;
      socket.emit('reaction:toggle', {
        messageId,
        conversationId: activeConversation.id,
        emoji,
      });
    },
    [socket, activeConversation]
  );

  const handleStartDirectChat = async (userId: number) => {
    try {
      const res = await axios.post('/api/conversations/direct', { userId });
      const newConv: Conversation = {
        id: res.data.id,
        type: 'direct',
        name: res.data.participants.find((p: any) => p.user?.id !== user?.id)?.user?.displayName || 'Chat',
        avatar: res.data.participants.find((p: any) => p.user?.id !== user?.id)?.user?.avatar || null,
        status: res.data.participants.find((p: any) => p.user?.id !== user?.id)?.user?.status || null,
        lastSeen: null,
        participants: res.data.participants.map((p: any) => ({
          id: p.user?.id,
          displayName: p.user?.displayName,
          avatar: p.user?.avatar,
          status: p.user?.status,
          role: p.role,
        })),
        lastMessage: null,
        unreadCount: 0,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);
      setShowUserSearch(false);
    } catch (err) {
      console.error('Failed to start direct chat:', err);
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Typing users for active conversation (excluding self)
  const activeTypingUsers = Object.values(typingUsers).filter(
    (tu) => tu.userId !== user?.id
  );

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent-color)' }}>Zentrix</span> Chat
          </h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Sign in to start messaging
          </p>
          <button
            onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
            className="px-8 py-3 rounded-lg font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
          >
            Sign In
          </button>
        </div>
        {showAuthModal && (
          <AuthModal
            mode={authMode}
            onClose={() => setShowAuthModal(false)}
            onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative z-50 h-full transition-transform duration-200 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          width: '320px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <Sidebar
          conversations={filteredConversations}
          activeConversation={activeConversation}
          onSelectConversation={(conv) => {
            setActiveConversation(conv);
            setIsMobileSidebarOpen(false);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onShowProfile={() => setShowProfileModal(true)}
          onShowNewGroup={() => setShowNewGroupModal(true)}
          onShowUserSearch={() => setShowUserSearch(true)}
          onLogout={() => { }}
          user={user}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConversation ? (
          <>
            <ChatHeader
              conversation={activeConversation}
              onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
              onBack={() => setIsMobileSidebarOpen(true)}
              isMobile={false}
              connected={connected}
            />

            <MessageList
              messages={messages}
              currentUserId={user.id}
              loading={messagesLoading}
              typingUsers={activeTypingUsers}
              conversation={activeConversation}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onReaction={handleReaction}
            />
            <div ref={messagesEndRef} />

            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              disabled={!connected}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-color)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Select a conversation to start messaging
              </p>
              <button
                onClick={() => setShowUserSearch(true)}
                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      {activeConversation?.type === 'group' && showRightPanel && (
        <div
          className="h-full overflow-y-auto"
          style={{
            width: '300px',
            backgroundColor: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border-subtle)',
          }}
        >
          <RightPanel
            conversation={activeConversation}
            currentUserId={user.id}
          />
        </div>
      )}

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showNewGroupModal && (
        <NewGroupModal
          onClose={() => setShowNewGroupModal(false)}
          onGroupCreated={(conv) => {
            setConversations((prev) => [conv, ...prev]);
            setActiveConversation(conv);
          }}
        />
      )}

      {showUserSearch && (
        <UserSearchModal
          onClose={() => setShowUserSearch(false)}
          onStartChat={handleStartDirectChat}
        />
      )}
    </div>
  );
}
