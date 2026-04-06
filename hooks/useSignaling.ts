'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  OfferPayload,
  AnswerPayload,
  IceCandidatePayload,
  ChatMessagePayload,
  UserJoinedPayload,
  UserDisconnectedPayload,
} from '@/lib/types/signaling';

export interface SignalingCallbacks {
  onAllUsers?: (users: string[]) => void;
  onUserJoined?: (payload: UserJoinedPayload) => void;
  onUserDisconnected?: (payload: UserDisconnectedPayload) => void;
  onOffer?: (payload: OfferPayload) => void;
  onAnswer?: (payload: AnswerPayload) => void;
  onIceCandidate?: (payload: IceCandidatePayload) => void;
  onChatMessage?: (payload: ChatMessagePayload) => void;
}

export function useSignaling(roomId: string, callbacks: SignalingCallbacks) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);

  // Keep callbacks ref up to date without re-running the effect
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!roomId) return;

    // Connect to the custom server (same origin)
    const socket = io({ path: '/socket.io', transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[signaling] connected as', socket.id);
      socket.emit('join-room', { roomId });
    });

    socket.on('all-users', (users: string[]) => {
      callbacksRef.current.onAllUsers?.(users);
    });

    socket.on('user-joined', (payload: UserJoinedPayload) => {
      callbacksRef.current.onUserJoined?.(payload);
    });

    socket.on('user-disconnected', (payload: UserDisconnectedPayload) => {
      callbacksRef.current.onUserDisconnected?.(payload);
    });

    socket.on('offer', (payload: OfferPayload) => {
      callbacksRef.current.onOffer?.(payload);
    });

    socket.on('answer', (payload: AnswerPayload) => {
      callbacksRef.current.onAnswer?.(payload);
    });

    socket.on('ice-candidate', (payload: IceCandidatePayload) => {
      callbacksRef.current.onIceCandidate?.(payload);
    });

    socket.on('chat-message', (payload: ChatMessagePayload) => {
      callbacksRef.current.onChatMessage?.(payload);
    });

    socket.on('disconnect', () => {
      console.log('[signaling] disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('[signaling] connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  // ── Outbound helpers ─────────────────────────────────────────────────────

  const sendOffer = useCallback((offer: RTCSessionDescriptionInit, to: string) => {
    socketRef.current?.emit('offer', { offer, to });
  }, []);

  const sendAnswer = useCallback((answer: RTCSessionDescriptionInit, to: string) => {
    socketRef.current?.emit('answer', { answer, to });
  }, []);

  const sendIceCandidate = useCallback((candidate: RTCIceCandidateInit, to: string) => {
    socketRef.current?.emit('ice-candidate', { candidate, to });
  }, []);

  const sendChatMessage = useCallback(
    (message: string, sender: string, timestamp: number) => {
      socketRef.current?.emit('chat-message', { roomId, message, sender, timestamp });
    },
    [roomId]
  );

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  return {
    socket: socketRef,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    sendChatMessage,
    disconnect,
  };
}
