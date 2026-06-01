import { useEffect, useRef } from 'react';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏', '🤔', '👀'];

export default function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-lg"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-transform hover:scale-125"
          style={{ backgroundColor: 'transparent' }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
