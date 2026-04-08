// Factory function for RTCPeerConnection with standard config
export function createPeerConnection(): RTCPeerConnection {
  const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    {
      urls: process.env.NEXT_PUBLIC_STUN_SERVER || 'stun:stun.l.google.com:19302',
    },
    // Additional public STUN servers for fallback
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  const pc = new RTCPeerConnection({
    iceServers: DEFAULT_ICE_SERVERS,
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  });

  return pc;
}
