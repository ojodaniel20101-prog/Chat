import { useMemo } from 'react';
import type { Message, Conversation } from '../../pages/ChatApp';
import { formatDateSeparator, formatFullDate } from '../../lib/utils';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  loading: boolean;
  typingUsers: Array<{ userId: number; userName: string }>;
  conversation: Conversation;
  onEditMessage: (messageId: number, content: string) => void;
  onDeleteMessage: (messageId: number) => void;
  onReaction: (messageId: number, emoji: string) => void;
}

export default function MessageList({
  messages,
  currentUserId,
  loading,
  typingUsers,
  conversation,
  onEditMessage,
  onDeleteMessage,
  onReaction,
}: MessageListProps) {
  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    messages.forEach((message) => {
      const date = new Date(message.created_at).toDateString();
      const existingGroup = groups.find((g) => g.date === date);
      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({ date, messages: [message] });
      }
    });
    return groups;
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }}
          />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading messages...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No messages yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Send a message to start the conversation
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center py-4">
                <span
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {formatDateSeparator(group.messages[0].created_at)}
                </span>
              </div>

              {/* Messages */}
              <div className="space-y-1">
                {group.messages.map((message, index) => {
                  const isOwn = message.sender_id === currentUserId;
                  const showAvatar =
                    !isOwn &&
                    (index === 0 ||
                      group.messages[index - 1]?.sender_id !== message.sender_id);

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      conversationType={conversation.type}
                      onEdit={onEditMessage}
                      onDelete={onDeleteMessage}
                      onReaction={onReaction}
                      currentUserId={currentUserId}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="mt-3 ml-4">
          <TypingIndicator userName={typingUsers[0].userName} />
        </div>
      )}
    </div>
  );
}
