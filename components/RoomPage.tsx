'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignaling } from '@/hooks/useSignaling';
import { useUserMedia } from '@/hooks/useUserMedia';
import { useWebRTC } from '@/hooks/useWebRTC';
import VideoTile from '@/components/VideoTile';
import CallControls from '@/components/CallControls';
import type { ConnectionStatus } from '@/lib/types/signaling';

interface Props {
  roomId: string;
}

export default function RoomPage({ roomId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // 1. Get local media
  const { localStream, error: mediaError, isLoading: mediaLoading, stopTracks } = useUserMedia();

  // 2. Setup signaling
  const signaling = useSignaling(roomId, {
    onAllUsers: (users) => {
      console.log('[room] all users:', users);
      users.forEach(id => initiateCall(id));
      if (users.length === 0) setStatus('waiting');
    },
    onUserJoined: ({ callerId }) => {
      console.log('[room] user joined:', callerId);
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
    onChatMessage: (payload) => {
      // Chat logic will be in Phase 5, for now we just log
      console.log('[room] chat received:', payload);
    }
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

  // 4. Control Handlers
  const toggleMic = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  const handleHangUp = useCallback(() => {
    hangUp();
    stopTracks();
    disconnectSignaling();
    router.push('/');
  }, [hangUp, stopTracks, disconnectSignaling, router]);

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

        <button 
          className="ctrl-btn" 
          style={{ minWidth: 'auto', padding: '0.4rem 0.8rem' }}
          onClick={() => setShowChat(!showChat)}
        >
          {showChat ? 'Hide Chat' : 'Show Chat'}
        </button>
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
            
            {remoteStreams.size === 0 && (
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

        {/* Chat Sidebar (Phase 4 UI Placeholder) */}
        {showChat && (
          <aside className="chat-sidebar">
            <div className="chat-sidebar__header">
              <span>Chat</span>
              <small>({roomId.slice(0, 4)})</small>
            </div>
            <div className="chat-log" data-test-id="chat-log">
              <div className="chat-message" data-test-id="chat-message">
                <div className="chat-message__sender">System</div>
                Welcome to the room! Chat functionality will be live in Phase 5.
              </div>
            </div>
            <div className="chat-sidebar__input-row">
              <input 
                data-test-id="chat-input"
                className="chat-input" 
                placeholder="Type a message..." 
                disabled 
              />
              <button 
                data-test-id="chat-submit"
                className="chat-submit" 
                disabled
              >
                Send
              </button>
            </div>
          </aside>
        )}
      </main>

      <CallControls 
        isMuted={isMuted} 
        isCameraOff={isCameraOff}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onHangUp={handleHangUp}
      />
    </div>
  );
}
