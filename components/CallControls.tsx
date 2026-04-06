'use client';

interface Props {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onHangUp: () => void;
  'data-test-id-mute'?: string;
  'data-test-id-camera'?: string;
  'data-test-id-hangup'?: string;
}

export default function CallControls({
  isMuted,
  isCameraOff,
  onToggleMic,
  onToggleCamera,
  onHangUp,
}: Props) {
  return (
    <div className="controls">
      {/* Mute Microphone */}
      <button 
        data-test-id="mute-mic-button"
        className={`ctrl-btn ${isMuted ? 'ctrl-btn--active' : ''}`}
        onClick={onToggleMic}
        title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        {isMuted ? (
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.17l5.98 6zm3.97 3.95l-1.28-1.27-1.33-1.33L5.1 4.27 3.84 5.53 9.08 10.77V11c0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5h-2c0 3.53 2.61 6.43 6 6.92V21h4v-3.08c1.39-.2 2.66-.77 3.73-1.61z"/></svg>
        ) : (
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
        )}
        <span>{isMuted ? 'Unmute' : 'Mute'}</span>
      </button>

      {/* Toggle Camera */}
      <button 
        data-test-id="toggle-camera-button"
        className={`ctrl-btn ${isCameraOff ? 'ctrl-btn--active' : ''}`}
        onClick={onToggleCamera}
        title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
      >
        {isCameraOff ? (
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H5c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/></svg>
        ) : (
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
        )}
        <span>{isCameraOff ? 'Cam On' : 'Cam Off'}</span>
      </button>

      {/* Hang Up */}
      <button 
        data-test-id="hangup-button"
        className="ctrl-btn ctrl-btn--danger"
        onClick={onHangUp}
        title="Leave Call"
      >
        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
        <span>Leave</span>
      </button>
    </div>
  );
}
