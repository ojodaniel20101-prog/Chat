import { useState, useRef, useCallback } from 'react';
import { Paperclip, Smile, Send } from 'lucide-react';
import axios from 'axios';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file', fileData?: { fileUrl: string; fileName: string; fileSize: number }) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, onTyping, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setContent('');
    inputRef.current?.focus();
  }, [content, disabled, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping();

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      // Stop typing indicator after 3 seconds of inactivity
    }, 3000);
  };

  const handleEmojiSelect = (emoji: any) => {
    setContent((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });

      const { fileUrl, fileName, fileSize, type } = res.data;
      const isImage = type === 'image';
      onSendMessage(fileName, isImage ? 'image' : 'file', { fileUrl, fileName, fileSize });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Auto-resize textarea
  const handleResize = () => {
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  return (
    <div
      className="shrink-0 px-4 py-3"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      {/* Upload progress */}
      {isUploading && (
        <div className="mb-2">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-hover)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${uploadProgress}%`,
                backgroundColor: 'var(--accent-color)',
              }}
            />
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Uploading... {uploadProgress}%
          </span>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-2.5 rounded-lg transition-colors shrink-0"
          style={{ color: 'var(--text-muted)' }}
          title="Attach file"
        >
          <Paperclip size={20} />
        </button>

        {/* Emoji button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="p-2.5 rounded-lg transition-colors"
            style={{ color: showEmojiPicker ? 'var(--accent-color)' : 'var(--text-muted)' }}
            title="Add emoji"
          >
            <Smile size={20} />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 z-50">
              <div
                className="rounded-xl overflow-hidden shadow-xl"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="dark"
                  previewPosition="none"
                  skinTonePosition="none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Text input */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => {
              handleInputChange(e);
              handleResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Reconnecting...' : 'Type a message...'}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-3xl text-sm outline-none resize-none"
            style={{
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              minHeight: '40px',
              maxHeight: '120px',
            }}
            rows={1}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="p-2.5 rounded-full transition-all shrink-0"
          style={{
            backgroundColor: content.trim() && !disabled ? 'var(--accent-color)' : 'var(--bg-hover)',
            opacity: content.trim() && !disabled ? 1 : 0.5,
          }}
        >
          <Send size={18} style={{ color: 'white' }} />
        </button>
      </div>
    </div>
  );
}
