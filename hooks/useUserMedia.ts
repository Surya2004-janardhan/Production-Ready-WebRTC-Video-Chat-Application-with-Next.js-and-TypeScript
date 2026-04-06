'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type UserMediaError = 'not-allowed' | 'not-found' | 'unknown' | null;

export function useUserMedia() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<UserMediaError>(null);
  const [isLoading, setIsLoading] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function getMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setLocalStream(stream);
        setError(null);
      } catch (err: unknown) {
        if (!active) return;
        const domErr = err as DOMException;
        if (domErr.name === 'NotAllowedError' || domErr.name === 'PermissionDeniedError') {
          setError('not-allowed');
        } else if (domErr.name === 'NotFoundError' || domErr.name === 'DevicesNotFoundError') {
          setError('not-found');
        } else {
          setError('unknown');
        }
        console.error('[useUserMedia] error:', domErr.name, domErr.message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    getMedia();

    return () => {
      active = false;
    };
  }, []);

  // Stop all tracks (call during hangup or unmount)
  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
  }, []);

  return { localStream, error, isLoading, stopTracks };
}
