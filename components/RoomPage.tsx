'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSignaling } from '@/hooks/useSignaling';
import { useUserMedia } from '@/hooks/useUserMedia';
import { useWebRTC } from '@/hooks/useWebRTC';
import VideoTile from '@/components/VideoTile';
import type { ConnectionStatus } from '@/lib/types/signaling';

interface Props {
  roomId: string;
}

export default function RoomPage({ roomId }: Props) {
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  
  // 1. Get local media
  const { localStream, error: mediaError, isLoading: mediaLoading, stopTracks } = useUserMedia();

  // 2. Setup signaling outbound helpers (stubs for now, will be wired below)
  const signaling = useSignaling(roomId, {
    onAllUsers: (users) => {
      console.log('[room] all users:', users);
      users.forEach(id => initiateCall(id));
      if (users.length === 0) setStatus('waiting');
    },
    onUserJoined: ({ callerId }) => {
      console.log('[room] user joined:', callerId);
      // Wait for them to send us an offer in mesh-topology
      setStatus('connecting');
    },
    onUserDisconnected: ({ socketId }) => {
      console.log('[room] user disconnected:', socketId);
      removePeer(socketId);
    },
    onOffer: ({ offer, from }) => {
      if (from) handleOffer(offer, from);
    },
    onAnswer: ({ answer, from }) => {
      if (from) handleAnswer(answer, from);
    },
    onIceCandidate: ({ candidate, from }) => {
      if (from) handleIceCandidate(candidate, from);
    },
  });

  const { 
    sendOffer, 
    sendAnswer, 
    sendIceCandidate, 
    disconnect: disconnectSignaling 
  } = signaling;

  // 3. Setup WebRTC mesh logic
  const {
    remoteStreams,
    initiateCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
    hangUp
  } = useWebRTC(localStream, {
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    onStatusChange: (newStatus) => setStatus(newStatus)
  });

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      hangUp();
      stopTracks();
      disconnectSignaling();
    };
  }, [hangUp, stopTracks, disconnectSignaling]);

  if (mediaLoading) {
    return (
      <div className="permission-screen">
        <div className="status-badge status-badge--connecting">
          <span className="status-badge__dot" />
          Requesting camera access...
        </div>
      </div>
    );
  }

  if (mediaError) {
    return (
      <div className="permission-screen">
        <div className="permission-screen__icon">⚠️</div>
        <h2>Camera Error</h2>
        <p>
          {mediaError === 'not-allowed' 
            ? "Please allow camera and microphone access to join the call." 
            : "Could not find a camera or microphone. Please check your devices."}
        </p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="room">
      <header className="room__topbar">
        <div className="room__topbar-id">
          Room: <span>{roomId.slice(0, 8)}</span>
        </div>
        
        <div className="room__status">
          {status === 'waiting' && (
            <div data-test-id="status-waiting" className="status-badge status-badge--waiting">
              <span className="status-badge__dot" />
              Waiting for others...
            </div>
          )}
          {status === 'connecting' && (
            <div data-test-id="status-connecting" className="status-badge status-badge--connecting">
              <span className="status-badge__dot" />
              Connecting...
            </div>
          )}
          {status === 'connected' && (
            <div data-test-id="status-connected" className="status-badge status-badge--connected">
              <span className="status-badge__dot" />
              Connected
            </div>
          )}
        </div>
      </header>

      <main className="room__body">
        <div className="room__videos">
          {/* Main Remote Grid */}
          <div 
            data-test-id="remote-video-container" 
            className={`remote-grid remote-grid--${Math.min(remoteStreams.size, 3)}`}
          >
            {Array.from(remoteStreams.entries()).map(([socketId, stream]) => (
              <VideoTile 
                key={socketId} 
                stream={stream} 
                label={`Peer ${socketId.slice(0, 4)}`}
              />
            ))}
            
            {remoteStreams.size === 0 && status === 'waiting' && (
              <div className="waiting-placeholder">
                <div className="waiting-placeholder__icon">👋</div>
                <p>You're the only one here</p>
                <small>Share the URL to invite others</small>
              </div>
            )}
          </div>

          {/* Local PiP */}
          {localStream && (
            <div className="local-pip">
              <VideoTile 
                stream={localStream} 
                muted 
                data-test-id="local-video" 
              />
            </div>
          )}
        </div>
      </main>

      {/* Placeholder for controls (Phase 4) */}
      <footer className="controls">
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Controls coming in Phase 4...
        </div>
      </footer>
    </div>
  );
}
