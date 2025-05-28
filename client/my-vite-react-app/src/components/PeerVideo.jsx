import React, { useEffect, useRef, useState } from 'react';

export default function PeerVideo({
  peer,
  userName,
  isMuted,
  isCameraOn,
  isPinned,
  onPin,
  isLocal,
  children,
}) {
  const ref = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (isLocal || !peer) return;
    peer.on('stream', (stream) => {
      setStream(stream);
      if (ref.current) ref.current.srcObject = stream;
    });
    return () => peer.off('stream');
  }, [peer, isLocal]);

  const containerStyle = isPinned
    ? {
        width: '400px',
        height: '300px',
        border: '3px solid #1976d2',
        borderRadius: 12,
        margin: 'auto',
        boxShadow: '0 0 15px rgba(25, 118, 210, 0.8)',
        backgroundColor: '#000',
      }
    : {
        width: '200px',
        height: '150px',
        border: '1px solid #ccc',
        borderRadius: 8,
        cursor: 'pointer',
        backgroundColor: '#000',
      };

  return (
    <div style={containerStyle} onClick={onPin} title={`Click to ${isPinned ? 'unpin' : 'pin'}`}>
      {isLocal ? (
        children
      ) : (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={false}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: containerStyle.borderRadius,
            objectFit: 'cover',
          }}
        />
      )}
      <div style={{
        position: 'absolute', bottom: 30, left: 8, color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 6px',
        borderRadius: 4, fontSize: 14, userSelect: 'none'
      }}>
        {userName}
      </div>
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        backgroundColor: isMuted ? 'red' : 'green',
        width: 12, height: 12, borderRadius: '50%'
      }} title={isMuted ? 'Muted' : 'Mic on'} />
      <div style={{
        position: 'absolute', bottom: 8, left: 28,
        backgroundColor: isCameraOn ? 'green' : 'red',
        width: 12, height: 12, borderRadius: '50%'
      }} title={isCameraOn ? 'Camera on' : 'Camera off'} />
    </div>
  );
}
