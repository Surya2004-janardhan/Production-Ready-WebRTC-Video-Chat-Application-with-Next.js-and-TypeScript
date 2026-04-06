'use client';

import { useRef, useState, useCallback } from 'react';
import { createPeerConnection } from '@/lib/webrtc/peerFactory';
import type { ConnectionStatus } from '@/lib/types/signaling';

interface WebRTCHandlers {
  sendOffer: (offer: RTCSessionDescriptionInit, to: string) => void;
  sendAnswer: (answer: RTCSessionDescriptionInit, to: string) => void;
  sendIceCandidate: (candidate: RTCIceCandidateInit, to: string) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

export function useWebRTC(localStream: MediaStream | null, handlers: WebRTCHandlers) {
  // Map: socketId → RTCPeerConnection
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  // Map: socketId → MediaStream (remote)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const { sendOffer, sendAnswer, sendIceCandidate, onStatusChange } = handlers;

  // ── Build a new RTCPeerConnection for a peer ────────────────────────────
  const buildPC = useCallback(
    (peerId: string): RTCPeerConnection => {
      if (pcsRef.current.has(peerId)) {
        pcsRef.current.get(peerId)!.close();
      }

      const pc = createPeerConnection();

      // Add local tracks so the remote peer receives our stream
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Trickle ICE — send candidates immediately as discovered
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(event.candidate.toJSON(), peerId);
        }
      };

      // When we receive a remote track, store the stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(peerId, remoteStream);
          return next;
        });
        onStatusChange?.('connected');
      };

      // Track connection state for status badge
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`[webrtc] peer ${peerId} → ${state}`);
        if (state === 'connecting' || state === 'new') {
          onStatusChange?.('connecting');
        } else if (state === 'connected') {
          onStatusChange?.('connected');
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          removePeer(peerId);
        }
      };

      pcsRef.current.set(peerId, pc);
      return pc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localStream, sendIceCandidate, onStatusChange]
  );

  // ── Called when WE are the existing peer and a newcomer joins ─────────
  const initiateCall = useCallback(
    async (peerId: string) => {
      onStatusChange?.('connecting');
      const pc = buildPC(peerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendOffer(offer, peerId);
    },
    [buildPC, sendOffer, onStatusChange]
  );

  // ── Called when WE receive an offer (we're the new peer) ─────────────
  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit, from: string) => {
      onStatusChange?.('connecting');
      const pc = buildPC(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendAnswer(answer, from);
    },
    [buildPC, sendAnswer, onStatusChange]
  );

  // ── Called when WE receive an answer ─────────────────────────────────
  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit, from: string) => {
      const pc = pcsRef.current.get(from);
      if (!pc) return;
      if (pc.signalingState === 'stable') return; // already set
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    },
    []
  );

  // ── ICE candidate relay ───────────────────────────────────────────────
  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit, from: string) => {
      const pc = pcsRef.current.get(from);
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[webrtc] failed to add ICE candidate:', err);
      }
    },
    []
  );

  // ── Remove a peer (disconnect / hangup) ───────────────────────────────
  const removePeer = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      pc.close();
      pcsRef.current.delete(peerId);
    }
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  }, []);

  // ── Close all connections (hangup) ────────────────────────────────────
  const hangUp = useCallback(() => {
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();
    setRemoteStreams(new Map());
  }, []);

  return {
    remoteStreams,
    initiateCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
    hangUp,
  };
}
