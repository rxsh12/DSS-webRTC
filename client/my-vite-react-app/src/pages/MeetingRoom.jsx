import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Peer from 'simple-peer';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';
import Header from '../components/Header';
import PeerVideo from '../components/PeerVideo';
import ParticipantList from '../components/ParticipantList';
import MeetingNotes from '../components/MeetingNotes';
import Timer from '../components/Timer';
import Controls from '../components/Controls';
import ChatPanel from '../components/ChatPanel';

const MeetingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [peers, setPeers] = useState([]);
  const [userName, setUserName] = useState('');
  const [users, setUsers] = useState([]);
  const [myStream, setMyStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [pinnedSocketId, setPinnedSocketId] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);

  const peersRef = useRef([]);
  const myVideo = useRef();
  const socketRef = useRef();

  useEffect(() => {
    const name = prompt('Enter your name');
    const finalName = name || `User-${uuidv4().slice(0, 4)}`;
    setUserName(finalName);

    // Create socket connection once
    socketRef.current = io('http://localhost:5000'); // update url as needed

    // Save socket id when connected
    socketRef.current.on('connect', () => {
      setMySocketId(socketRef.current.id);
    });

    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setMyStream(stream);
      if (myVideo.current) {
        myVideo.current.srcObject = stream;
      }

      socketRef.current.emit('join-room', { roomId, userName: finalName });
    });

    // Listeners - outside getUserMedia
    socketRef.current.on('all-users', ({ users: usersInRoom }) => {
      const newPeers = usersInRoom.map((user) => {
        const peer = createPeer(user.socketId, socketRef.current.id, myStream);
        peersRef.current.push({ peerID: user.socketId, peer, userName: user.userName });
        return { peerID: user.socketId, peer, userName: user.userName };
      });
      setPeers(newPeers);
      setUsers([{ socketId: socketRef.current.id, userName: finalName }, ...usersInRoom]);
    });

    socketRef.current.on('user-joined', ({ socketId: callerId, userName: callerName }) => {
      const peer = addPeer(null, callerId, myStream);
      peersRef.current.push({ peerID: callerId, peer, userName: callerName });
      setPeers((prevPeers) => [...prevPeers, { peerID: callerId, peer, userName: callerName }]);
      setUsers((prev) => [...prev, { socketId: callerId, userName: callerName }]);
    });

    socketRef.current.on('user-signal', ({ signal, callerId }) => {
      const peerObj = peersRef.current.find((p) => p.peerID === callerId);
      if (peerObj) {
        peerObj.peer.signal(signal);
      }
    });

    socketRef.current.on('receive-returned-signal', ({ id, signal }) => {
      const item = peersRef.current.find((p) => p.peerID === id);
      if (item) {
        item.peer.signal(signal);
      }
    });

    socketRef.current.on('user-disconnected', (socketId) => {
      const peerObj = peersRef.current.find((p) => p.peerID === socketId);
      if (peerObj) peerObj.peer.destroy();
      peersRef.current = peersRef.current.filter((p) => p.peerID !== socketId);
      setPeers((prev) => prev.filter((p) => p.peerID !== socketId));
      setUsers((prev) => prev.filter((u) => u.socketId !== socketId));
    });

    return () => {
      socketRef.current.disconnect();
      myStream?.getTracks().forEach((track) => track.stop());
    };
  }, [roomId]);

  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on('signal', (signal) => {
      socketRef.current.emit('send-signal', { userToSignal, callerId, signal, userName });
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    if (incomingSignal) peer.signal(incomingSignal);
    peer.on('signal', (signal) => {
      socketRef.current.emit('return-signal', { signal, callerId });
    });
    return peer;
  };

  const toggleMic = () => {
    if (!myStream) return;
    myStream.getAudioTracks()[0].enabled = isMuted; // invert current mute state
    setIsMuted((prev) => !prev);
    socketRef.current.emit('toggle-mic', { roomId, userName, isMicOn: !isMuted });
  };

  const toggleVideo = () => {
    if (!myStream) return;
    myStream.getVideoTracks()[0].enabled = isVideoOn; // invert current video state
    setIsVideoOn((prev) => !prev);
    socketRef.current.emit('toggle-camera', { roomId, userName, isCameraOn: !isVideoOn });
  };

  const startScreenShare = async () => {
    if (screenSharing) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const senderTrack = myStream.getVideoTracks()[0];

      // Replace track in local stream
      senderTrack.stop();
      myStream.removeTrack(senderTrack);
      myStream.addTrack(screenTrack);

      // Replace track in each peer connection
      peersRef.current.forEach(({ peer }) => {
        const sender = peer._pc.getSenders().find((s) => s.track.kind === 'video');
        sender.replaceTrack(screenTrack);
      });

      screenTrack.onended = () => {
        navigator.mediaDevices.getUserMedia({ video: true }).then((camStream) => {
          const camTrack = camStream.getVideoTracks()[0];
          myStream.removeTrack(screenTrack);
          myStream.addTrack(camTrack);

          peersRef.current.forEach(({ peer }) => {
            const sender = peer._pc.getSenders().find((s) => s.track.kind === 'video');
            sender.replaceTrack(camTrack);
          });

          setScreenSharing(false);
        });
      };

      setScreenSharing(true);
      socketRef.current.emit('screen-share', { roomId, userName, isScreenSharing: true });
    } catch (err) {
      console.error('Screen share failed', err);
    }
  };

  const leaveMeeting = () => {
    navigate('/');
    window.location.reload();
  };

  const handlePin = (socketId) => {
    setPinnedSocketId((prev) => (prev === socketId ? null : socketId));
  };

  return (
    <div>
      <Header roomId={roomId} />
      <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <Timer />
        <Controls
          isMuted={isMuted}
          isVideoOn={isVideoOn}
          onToggleMic={toggleMic}
          onToggleVideo={toggleVideo}
          onScreenShare={startScreenShare}
          onLeave={leaveMeeting}
        />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px', justifyContent: 'center' }}>
        <PeerVideo
          isLocal
          isMuted={isMuted}
          isCameraOn={isVideoOn}
          userName={userName}
          isPinned={pinnedSocketId === mySocketId}
          onPin={() => handlePin(mySocketId)}
        >
          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
          />
        </PeerVideo>
        {peers.map(({ peerID, peer, userName }) => (
          <PeerVideo
            key={peerID}
            peer={peer}
            userName={userName}
            isMuted={false}
            isCameraOn={true}
            isPinned={pinnedSocketId === peerID}
            onPin={() => handlePin(peerID)}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '20px', padding: '10px', flexWrap: 'wrap' }}>
        <ParticipantList users={users} pinnedSocketId={pinnedSocketId} />
        <MeetingNotes socket={socketRef.current} roomId={roomId} />
        <ChatPanel socket={socketRef.current} userName={userName} />
      </div>
    </div>
  );
};

export default MeetingRoom;
