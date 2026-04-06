'use client';

import { useEffect, useRef } from 'react';

interface Props {
  stream: MediaStream;
  muted?: boolean;
  label?: string;
  'data-test-id'?: string;
}

export default function VideoTile({ stream, muted = false, label, ...rest }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (videoRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <div className="remote-tile">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        {...rest}
      />
      {label && <div className="remote-tile__name">{label}</div>}
    </div>
  );
}
