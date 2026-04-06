'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignaling } from '@/hooks/useSignaling';
import { useUserMedia } from '@/hooks/useUserMedia';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useChat } from '@/hooks/useChat';
import VideoTile from '@/components/VideoTile';
import CallControls from '@/components/CallControls';
import ChatPanel from '@/components/ChatPanel';
import type { ConnectionStatus, ChatMessagePayload } from '@/lib/types/signaling';

interface Props {
  roomId: string;
}

export default function RoomPage({ roomId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [myName] = useState(() => `User-${Math.floor(Math.random() * 1000)}`);

  // 1. Get local media
  const { localStream, error: mediaError, isLoading: mediaLoading, stopTracks } = useUserMedia();

  // 2. Chat logic
  const { messages, send: sendChat, receive: receiveChat } = useChat(
    (msg, sender, ts) => signaling.sendChatMessage(msg, sender, ts),
    myName
  );

  // 3. Setup signaling
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
    onChatMessage: (payload: ChatMessagePayload) => {
      if (signaling.socket.current?.id) {
        receiveChat(payload, signaling.socket.current.id);
      }
    }
  });

  const { 
    sendOffer, 
    sendAnswer, 
    sendIceCandidate, 
    disconnect: disconnectSignaling 
  } = signaling;

  // 4. Setup WebRTC mesh logic
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

  // 5. Control Handlers
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
          className={`ctrl-btn ${showChat ? 'ctrl-btn--active' : ''}`}
          style={{ minWidth: 'auto', padding: '0.4rem 0.8rem', flexDirection: 'row', gap: '0.4rem' }}
          onClick={() => setShowChat(!showChat)}
        >
          <svg fill="currentColor" viewBox="0 0 24 24" style={{width: 16, height: 16}}><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
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

        {/* Chat Sidebar */}
        {showChat && (
          <ChatPanel 
            messages={messages} 
            onSendMessage={sendChat} 
            roomId={roomId} 
          />
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
