import { useState, useRef, useEffect } from 'react';
import { Check, CheckCheck, Pencil, Trash2, Smile, X } from 'lucide-react';
import type { Message } from '../../pages/ChatApp';
import { formatFullDate, formatTime, getAvatarColor, getInitials } from '../../lib/utils';
import ReactionPicker from './ReactionPicker';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  conversationType: 'direct' | 'group';
  onEdit: (messageId: number, content: string) => void;
  onDelete: (messageId: number) => void;
  onReaction: (messageId: number, emoji: string) => void;
  currentUserId: number;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  conversationType,
  onEdit,
  onDelete,
  onReaction,
  currentUserId,
}: MessageBubbleProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isHovered, setIsHovered] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowContextMenu(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(message.id);
    setShowContextMenu(false);
  };

  // Parse read_by
  const readBy = (() => {
    try {
      return JSON.parse(message.read_by || '[]');
    } catch {
      return [];
    }
  })();

  const isRead = (readBy || []).length > 0;

  // Group reactions by emoji
  const reactionGroups = (message.reactions || []).reduce(
    (acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, userReacted: false };
      acc[r.emoji].count++;
      if (r.user_id === currentUserId) acc[r.emoji].userReacted = true;
      return acc;
    },
    {} as Record<string, { count: number; userReacted: boolean }>
  );

  if (message.deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} py-1`}>
        <span
          className="text-xs italic px-3 py-1.5 rounded-lg"
          style={{ color: 'var(--text-muted)' }}
        >
          This message was deleted
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} py-0.5 group`}
      onContextMenu={handleRightClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar (for group chats, not own) */}
      {!isOwn && conversationType === 'group' && showAvatar && message.sender && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold mr-2 mt-1 shrink-0 self-start"
          style={{
            backgroundColor: getAvatarColor(message.sender.displayName),
            color: 'white',
          }}
        >
          {getInitials(message.sender.displayName)}
        </div>
      )}
      {!isOwn && conversationType === 'group' && !showAvatar && (
        <div className="w-7 mr-2 shrink-0" />
      )}

      <div className="flex flex-col max-w-[65%]">
        {/* Sender name in group chats */}
        {!isOwn && conversationType === 'group' && showAvatar && message.sender && (
          <span
            className="text-xs font-medium ml-1 mb-0.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {message.sender.displayName}
          </span>
        )}

        <div className="flex items-end gap-1">
          {/* Reaction quick-add (on hover) */}
          {!isEditing && isHovered && (
            <div className="flex items-center gap-0.5 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowReactionPicker(true)}
                className="p-1 rounded-full transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <Smile size={14} />
              </button>
              {isOwn && (
                <>
                  <button
                    onClick={handleEdit}
                    className="p-1 rounded-full transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1 rounded-full transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          )}

          <div
            ref={bubbleRef}
            className="relative"
            style={{
              backgroundColor: isOwn ? 'var(--bg-active)' : 'var(--bg-card)',
              borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            }}
          >
            {isEditing ? (
              <div className="px-3 py-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none resize-none"
                  style={{ color: 'var(--text-primary)', minHeight: '40px' }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    }
                    if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditContent(message.content);
                    }
                  }}
                />
                <div className="flex items-center justify-end gap-2 mt-1">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(message.content);
                    }}
                    className="p-1 rounded transition-colors hover:bg-[var(--bg-hover)]"
                  >
                    <X size={14} style={{ color: 'var(--text-muted)' }} />
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-2.5">
                {/* Image message */}
                {message.type === 'image' && message.file_url && (
                  <img
                    src={message.file_url}
                    alt={message.file_name || 'Image'}
                    className="max-w-[280px] rounded-lg mb-1 cursor-pointer"
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                    onClick={() => window.open(message.file_url!, '_blank')}
                  />
                )}

                {/* File message */}
                {message.type === 'file' && message.file_url && (
                  <a
                    href={message.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg mb-1 transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ backgroundColor: 'var(--bg-base)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--accent-color)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {message.file_name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {message.file_size ? `${(message.file_size / 1024).toFixed(1)} KB` : 'File'}
                      </p>
                    </div>
                  </a>
                )}

                {/* Text content */}
                {message.content && (
                  <p
                    className="text-[15px] leading-relaxed whitespace-pre-wrap break-words"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {message.content}
                  </p>
                )}

                {/* Edited indicator */}
                {message.edited && (
                  <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>
                    (edited)
                  </span>
                )}
              </div>
            )}

            {/* Reaction picker popover */}
            {showReactionPicker && (
              <div className="absolute bottom-full mb-1 left-0 z-50">
                <ReactionPicker
                  onSelect={(emoji) => {
                    onReaction(message.id, emoji);
                    setShowReactionPicker(false);
                  }}
                  onClose={() => setShowReactionPicker(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 ml-1">
            {Object.entries(reactionGroups).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => onReaction(message.id, emoji)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all"
                style={{
                  backgroundColor: data.userReacted ? 'var(--bg-active)' : 'var(--reaction-bg)',
                  border: data.userReacted ? '1px solid var(--accent-color)' : '1px solid transparent',
                }}
              >
                <span>{emoji}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{data.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp and read receipt */}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end mr-1' : 'ml-1'}`}>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {formatTime(message.created_at)}
          </span>
          {isOwn && (
            <span style={{ color: isRead ? 'var(--success)' : 'var(--text-muted)' }}>
              {isRead ? (
                <CheckCheck size={13} />
              ) : (
                <Check size={13} />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Context menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[100] py-1 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            minWidth: '140px',
            animation: 'scaleIn 0.15s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onReaction(message.id, '👍');
              setShowContextMenu(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Smile size={14} /> Add Reaction
          </button>
          {isOwn && (
            <>
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
