'use client';

import { useState, useCallback } from 'react';
import type { ChatMessagePayload } from '@/lib/types/signaling';

export interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  timestamp: number;
  fromSelf: boolean;
  socketId?: string;
}

export function useChat(
  sendChatMessage: (msg: string, sender: string, ts: number) => void,
  myName: string
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const receive = useCallback((payload: ChatMessagePayload, mySocketId: string) => {
    if (payload.from === mySocketId) return; // Already added optimistically
    
    setMessages((prev) => [
      ...prev,
      {
        id: `${payload.timestamp}-${payload.from}`,
        message: payload.message,
        sender: payload.sender,
        timestamp: payload.timestamp,
        fromSelf: false,
        socketId: payload.from,
      },
    ]);
  }, []);

  const send = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      const timestamp = Date.now();
      sendChatMessage(message.trim(), myName, timestamp);
      // Optimistically add own message
      setMessages((prev) => [
        ...prev,
        {
          id: `${timestamp}-self`,
          message: message.trim(),
          sender: myName,
          timestamp,
          fromSelf: true,
        },
      ]);
    },
    [sendChatMessage, myName]
  );

  return { messages, send, receive };
}
