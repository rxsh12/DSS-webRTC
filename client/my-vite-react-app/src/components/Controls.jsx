import React from 'react';

export default function Controls({
  isMuted,
  isVideoOn,
  onToggleMic,
  onToggleVideo,
  onScreenShare,
  onLeave,
}) {
  return (
    <div className="controls" style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '10px' }}>
      <button onClick={onToggleMic}>{isMuted ? 'Unmute' : 'Mute'}</button>
      <button onClick={onToggleVideo}>{isVideoOn ? 'Stop Video' : 'Start Video'}</button>
      <button onClick={onScreenShare}>Share Screen</button>
      <button onClick={onLeave} style={{ color: 'red' }}>Leave</button>
    </div>
  );
}

