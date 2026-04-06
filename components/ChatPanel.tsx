'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/hooks/useChat';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  roomId: string;
}

export default function ChatPanel({ messages, onSendMessage, roomId }: Props) {
  const [input, setInput] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  // Auto-scroll chat log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar__header">
        <span>Chat</span>
        <small>({roomId.slice(0, 8)})</small>
      </div>

      <div className="chat-log" data-test-id="chat-log" ref={logRef}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            data-test-id="chat-message" 
            className={`chat-message ${msg.fromSelf ? 'chat-message--self' : ''}`}
          >
            <div className="chat-message__sender">
              {msg.fromSelf ? 'You' : msg.sender}
            </div>
            {msg.message}
          </div>
        ))}
        {messages.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem' }}>
            No messages yet. Say hello!
          </div>
        )}
      </div>

      <form className="chat-sidebar__input-row" onSubmit={handleSubmit}>
        <input 
          data-test-id="chat-input"
          className="chat-input" 
          placeholder="Type a message..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button 
          data-test-id="chat-submit"
          type="submit"
          className="chat-submit"
          disabled={!input.trim()}
        >
          Send
        </button>
      </form>
    </aside>
  );
}
