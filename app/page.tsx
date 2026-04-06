'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function HomePage() {
  const router = useRouter();
  const [roomInput, setRoomInput] = useState('');

  const createRoom = () => {
    const id = uuidv4();
    router.push(`/room/${id}`);
  };

  const joinRoom = () => {
    const id = roomInput.trim();
    if (!id) return;
    router.push(`/room/${id}`);
  };

  return (
    <main className="home">
      <div className="home__logo">📹</div>
      <h1 className="home__title">WebRTC Video Chat</h1>
      <p className="home__subtitle">
        Crystal-clear, peer-to-peer video calls. No plugins, no accounts.
      </p>

      <div className="home__card">
        <h2>Start a new call</h2>
        <button id="create-room-btn" className="home__btn-create" onClick={createRoom}>
          + Create New Room
        </button>

        <div className="home__divider">or join existing</div>

        <div className="home__join-row">
          <input
            id="room-id-input"
            className="home__input"
            placeholder="Paste Room ID…"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
          />
          <button id="join-room-btn" className="home__btn-join" onClick={joinRoom}>
            Join
          </button>
        </div>
      </div>
    </main>
  );
}
