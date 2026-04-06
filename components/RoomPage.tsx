'use client';

import { useState, useCallback } from 'react';
import { useSignaling } from '@/hooks/useSignaling';
import type { ConnectionStatus } from '@/lib/types/signaling';

interface Props {
  roomId: string;
}

export default function RoomPage({ roomId }: Props) {
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  const [peers, setPeers] = useState<string[]>([]);

  const handleAllUsers = useCallback((users: string[]) => {
    console.log('[room] existing users:', users);
    setPeers(users);
    if (users.length > 0) setStatus('connecting');
  }, []);

  const handleUserJoined = useCallback(({ callerId }: { callerId: string }) => {
    console.log('[room] user joined:', callerId);
    setPeers((prev) => [...prev, callerId]);
    setStatus('connecting');
  }, []);

  const handleUserDisconnected = useCallback(({ socketId }: { socketId: string }) => {
    console.log('[room] user disconnected:', socketId);
    setPeers((prev) => {
      const next = prev.filter((id) => id !== socketId);
      if (next.length === 0) setStatus('waiting');
      return next;
    });
  }, []);

  useSignaling(roomId, {
    onAllUsers: handleAllUsers,
    onUserJoined: handleUserJoined,
    onUserDisconnected: handleUserDisconnected,
  });

  return (
    <div className="permission-screen">
      <div className="permission-screen__icon">📹</div>
      <h2>Room: {roomId.slice(0, 8)}…</h2>
      <p>
        Status:{' '}
        {status === 'waiting' && (
          <span data-test-id="status-waiting" className="status-badge status-badge--waiting">
            <span className="status-badge__dot" />
            Waiting for others…
          </span>
        )}
        {status === 'connecting' && (
          <span data-test-id="status-connecting" className="status-badge status-badge--connecting">
            <span className="status-badge__dot" />
            Connecting…
          </span>
        )}
        {status === 'connected' && (
          <span data-test-id="status-connected" className="status-badge status-badge--connected">
            <span className="status-badge__dot" />
            Connected
          </span>
        )}
      </p>
      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.5 }}>
        Peers in room: {peers.length}
      </p>
    </div>
  );
}
