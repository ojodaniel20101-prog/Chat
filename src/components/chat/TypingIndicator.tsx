interface TypingIndicatorProps {
  userName: string;
}

export default function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1 px-3 py-2 rounded-2xl"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full typing-dot"
          style={{ backgroundColor: 'var(--accent-color)' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full typing-dot"
          style={{ backgroundColor: 'var(--accent-color)' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full typing-dot"
          style={{ backgroundColor: 'var(--accent-color)' }}
        />
      </div>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {userName} is typing...
      </span>
    </div>
  );
}
