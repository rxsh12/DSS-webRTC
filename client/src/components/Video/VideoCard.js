import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const VideoCard = ({ peer, number }) => {
  const ref = useRef();

  useEffect(() => {
    // When peer gets a stream, set it as the video srcObject
    peer.on('stream', (stream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });

    // Cleanup on unmount
    return () => {
      peer.removeAllListeners('stream');
    };
  }, [peer]);

  return <StyledVideo playsInline autoPlay ref={ref} />;
};

export default VideoCard;

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
