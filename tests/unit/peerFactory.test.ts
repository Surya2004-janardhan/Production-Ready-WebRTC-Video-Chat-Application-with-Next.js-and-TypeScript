describe('createPeerConnection', () => {
  const OriginalRTCPeerConnection = (global as any).RTCPeerConnection;

  afterEach(() => {
    (global as any).RTCPeerConnection = OriginalRTCPeerConnection;
    delete process.env.NEXT_PUBLIC_STUN_SERVER;
    // clear module cache so env changes are picked up on next require
    delete require.cache[require.resolve('../../lib/webrtc/peerFactory')];
  });

  it('passes configured iceServers to RTCPeerConnection (env fallback)', () => {
    let capturedConfig: any = null;

    (global as any).RTCPeerConnection = function (config: any) {
      capturedConfig = config;
      return {} as any;
    } as any;

    // Ensure env var not set -> default used
    delete process.env.NEXT_PUBLIC_STUN_SERVER;

    const { createPeerConnection } = require('../../lib/webrtc/peerFactory');
    const pc = createPeerConnection();

    expect(pc).toBeDefined();
    expect(capturedConfig).not.toBeNull();
    expect(Array.isArray(capturedConfig.iceServers)).toBeTruthy();
    expect(capturedConfig.iceServers.length).toBeGreaterThanOrEqual(1);
  });

  it('uses NEXT_PUBLIC_STUN_SERVER when provided', () => {
    let capturedConfig: any = null;
    (global as any).RTCPeerConnection = function (config: any) {
      capturedConfig = config;
      return {} as any;
    } as any;

    process.env.NEXT_PUBLIC_STUN_SERVER = 'stun:example.test:3478';

    // require after setting env so module picks it up
    const { createPeerConnection } = require('../../lib/webrtc/peerFactory');
    createPeerConnection();

    expect(capturedConfig).not.toBeNull();
    const urls = capturedConfig.iceServers.map((s: any) => s.urls);
    expect(urls).toContain('stun:example.test:3478');
  });
});
