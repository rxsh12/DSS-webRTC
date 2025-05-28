import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import styled from 'styled-components';
import socket from '../../socket';
import VideoCard from '../Video/VideoCard';
import BottomBar from '../BottomBar/BottomBar';
import Chat from '../Chat/Chat';

const Room = (props) => {
  const currentUser = sessionStorage.getItem('user');
  const [peers, setPeers] = useState([]);
  const [userVideoAudio, setUserVideoAudio] = useState({
    localUser: { video: true, audio: true },
  });
  const [videoDevices, setVideoDevices] = useState([]);
  const [displayChat, setDisplayChat] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [showVideoDevices, setShowVideoDevices] = useState(false);
  const [pinnedUser, setPinnedUser] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [meetingTime, setMeetingTime] = useState(0);

  const peersRef = useRef([]);
  const userVideoRef = useRef();
  const screenTrackRef = useRef();
  const userStream = useRef();
  const roomId = props.match.params.roomId;

  // Meeting timer setup
  useEffect(() => {
    const interval = setInterval(() => {
      setMeetingTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Get Video Devices
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const filtered = devices.filter((device) => device.kind === 'videoinput');
      setVideoDevices(filtered);
    });

    // Set Back Button Event
    window.addEventListener('popstate', goToBack);

    // Connect Camera & Mic
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideoRef.current.srcObject = stream;
        userStream.current = stream;

        socket.emit('BE-join-room', { roomId, userName: currentUser });
        socket.on('FE-user-join', (users) => {
          const peers = [];
          users.forEach(({ userId, info }) => {
            let { userName, video, audio } = info;

            if (userName !== currentUser) {
              const peer = createPeer(userId, socket.id, stream);

              peer.userName = userName;
              peer.peerID = userId;

              peersRef.current.push({
                peerID: userId,
                peer,
                userName,
              });
              peers.push(peer);

              setUserVideoAudio((preList) => {
                return {
                  ...preList,
                  [peer.userName]: { video, audio },
                };
              });
            }
          });

          setPeers(peers);
        });

        socket.on('FE-receive-call', ({ signal, from, info }) => {
          let { userName, video, audio } = info;
          const peerFound = findPeer(from);

          // Only add if peer not found
          if (!peerFound) {
            const peer = addPeer(signal, from, stream);

            peer.userName = userName;

            peersRef.current.push({
              peerID: from,
              peer,
              userName: userName,
            });
            setPeers((users) => {
              return [...users, peer];
            });
            setUserVideoAudio((preList) => {
              return {
                ...preList,
                [peer.userName]: { video, audio },
              };
            });
          }
        });

        socket.on('FE-call-accepted', ({ signal, answerId }) => {
          const peerObj = findPeer(answerId);
          if (peerObj) peerObj.peer.signal(signal);
        });

        socket.on('FE-user-leave', ({ userId, userName }) => {
          const peerObj = findPeer(userId);
          if (peerObj) peerObj.peer.destroy();
          setPeers((users) => {
            users = users.filter((user) => user.peerID !== userId);
            return [...users];
          });
          peersRef.current = peersRef.current.filter(({ peerID }) => peerID !== userId);
        });
      });

    socket.on('FE-toggle-camera', ({ userId, switchTarget }) => {
      const peerObj = findPeer(userId);
      if (!peerObj) return;

      setUserVideoAudio((preList) => {
        let video = preList[peerObj.userName].video;
        let audio = preList[peerObj.userName].audio;

        if (switchTarget === 'video') video = !video;
        else audio = !audio;

        return {
          ...preList,
          [peerObj.userName]: { video, audio },
        };
      });
    });

    return () => {
      socket.disconnect();
      window.removeEventListener('popstate', goToBack);
    };
    // eslint-disable-next-line
  }, []);

  // Pin / unpin video toggle
  const togglePin = (userName) => {
    setPinnedUser((prev) => (prev === userName ? null : userName));
  };

  function createPeer(userId, caller, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('BE-call-user', {
        userToCall: userId,
        from: caller,
        signal,
      });
    });
    peer.on('disconnect', () => {
      peer.destroy();
    });

    return peer;
  }

  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('BE-accept-call', { signal, to: callerId });
    });

    peer.on('disconnect', () => {
      peer.destroy();
    });

    peer.signal(incomingSignal);

    return peer;
  }

  function findPeer(id) {
    return peersRef.current.find((p) => p.peerID === id);
  }

  // Video rendering with pin support
  function createUserVideo(peer, index, arr) {
    // If pinned, skip rendering here (will render separately bigger)
    if (pinnedUser === peer.userName) return null;

    return (
      <VideoBox
        className={`width-peer${peers.length > 8 ? '' : peers.length}`}
        onClick={() => togglePin(peer.userName)}
        key={index}
      >
        {writeUserName(peer.userName)}
        <FaIcon className='fas fa-expand' />
        <VideoCard key={index} peer={peer} number={arr.length} />
      </VideoBox>
    );
  }

  // Render local video box with pin/unpin click
  const renderLocalVideo = () => {
    if (pinnedUser === 'localUser') return null;

    return (
      <VideoBox
        className={`width-peer${peers.length > 8 ? '' : peers.length}`}
        onClick={() => togglePin('localUser')}
      >
        {userVideoAudio['localUser'].video ? null : (
          <UserName>{currentUser}</UserName>
        )}
        <FaIcon className='fas fa-expand' />
        <MyVideo onClick={() => {}} ref={userVideoRef} muted autoPlay playsInline />
      </VideoBox>
    );
  };

  // Render pinned video big at top
  const renderPinnedVideo = () => {
    if (!pinnedUser) return null;

    if (pinnedUser === 'localUser') {
      return (
        <PinnedVideoBox onClick={() => togglePin('localUser')}>
          {userVideoAudio['localUser'].video ? null : <UserName>{currentUser}</UserName>}
          <FaIcon className='fas fa-compress' />
          <MyVideo ref={userVideoRef} muted autoPlay playsInline />
        </PinnedVideoBox>
      );
    } else {
      const peerObj = peersRef.current.find((p) => p.userName === pinnedUser);
      if (!peerObj) return null;

      return (
        <PinnedVideoBox onClick={() => togglePin(pinnedUser)}>
          {userVideoAudio[pinnedUser] && !userVideoAudio[pinnedUser].video ? (
            <UserName>{pinnedUser}</UserName>
          ) : null}
          <FaIcon className='fas fa-compress' />
          <VideoCard peer={peerObj.peer} number={peers.length + 1} />
        </PinnedVideoBox>
      );
    }
  };

  function writeUserName(userName) {
    if (userVideoAudio.hasOwnProperty(userName)) {
      if (!userVideoAudio[userName].video) {
        return <UserName>{userName}</UserName>;
      }
    }
    return null;
  }

  // Format time in mm:ss
  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (sec % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Copy URL to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Meeting URL copied to clipboard!');
  };

  // Render participant list sidebar
  const renderParticipants = () => {
    return (
      <ParticipantsSidebar>
        <h3>Participants ({peers.length + 1})</h3>
        <Participant onClick={() => togglePin('localUser')}>
          {currentUser} {pinnedUser === 'localUser' ? '(Pinned)' : ''}
        </Participant>
        {peersRef.current.map(({ userName }) => (
          <Participant key={userName} onClick={() => togglePin(userName)}>
            {userName} {pinnedUser === userName ? '(Pinned)' : ''}
          </Participant>
        ))}
      </ParticipantsSidebar>
    );
  };

  // Stub for goToBack (implement as needed)
  function goToBack() {
    // You may want to handle custom back navigation logic here
    // For now, just log
    console.log('Back button pressed');
  }

  return (
    <Container>
      <RoomWrapper>
        {renderPinnedVideo()}
        <VideoContainer>
          {renderLocalVideo()}
          {peers.map((peer, index, arr) => createUserVideo(peer, index, arr))}
        </VideoContainer>

        {showParticipants && renderParticipants()}

        <ControlsWrapper>
          <BottomBar
            roomId={roomId}
            userVideoAudio={userVideoAudio}
            setUserVideoAudio={setUserVideoAudio}
            displayChat={displayChat}
            setDisplayChat={setDisplayChat}
            screenShare={screenShare}
            setScreenShare={setScreenShare}
            showVideoDevices={showVideoDevices}
            setShowVideoDevices={setShowVideoDevices}
            videoDevices={videoDevices}
            copyLink={copyLink}
            showParticipants={showParticipants}
            setShowParticipants={setShowParticipants}
            showNotes={showNotes}
            setShowNotes={setShowNotes}
            notes={notes}
            setNotes={setNotes}
            meetingTime={formatTime(meetingTime)}
          />
        </ControlsWrapper>

        {displayChat && <Chat />}

        {showNotes && (
          <NotesPanel>
            <h4>Meeting Notes</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write notes here..."
            />
          </NotesPanel>
        )}
      </RoomWrapper>
    </Container>
  );
};

export default Room;

// Styled components

const Container = styled.div`
  position: relative;
  height: 100vh;
  background-color: #e5e5e5;
  overflow: hidden;
`;

const RoomWrapper = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const VideoContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  overflow-y: auto;
`;

const VideoBox = styled.div`
  background-color: #000;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  width: 300px;
  height: 225px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.width-peer1 {
    width: 90vw;
    height: 60vh;
  }
  &.width-peer2 {
    width: 45vw;
    height: 40vh;
  }
  &.width-peer3,
  &.width-peer4 {
    width: 45vw;
    height: 35vh;
  }
  &.width-peer5,
  &.width-peer6,
  &.width-peer7,
  &.width-peer8 {
    width: 30vw;
    height: 25vh;
  }

  video {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
`;

const PinnedVideoBox = styled(VideoBox)`
  width: 90vw;
  height: 60vh;
  cursor: pointer;
  margin: 0 auto 10px auto;
`;

const MyVideo = styled.video`
  border-radius: 10px;
  background-color: #000;
`;

const UserName = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  color: white;
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
`;

const FaIcon = styled.i`
  position: absolute;
  top: 8px;
  right: 8px;
  color: white;
  font-size: 20px;
  opacity: 0.7;
  pointer-events: none;
`;

const ControlsWrapper = styled.div`
  padding: 10px;
  background-color: #ffffffcc;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
`;

const ParticipantsSidebar = styled.div`
  position: fixed;
  top: 60px;
  right: 0;
  width: 250px;
  height: calc(100vh - 60px);
  background-color: #f5f7ff;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  padding: 15px;
  overflow-y: auto;
  z-index: 50;

  h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-weight: 600;
    color: #333;
  }
`;

const Participant = styled.div`
  padding: 8px 6px;
  margin-bottom: 6px;
  cursor: pointer;
  border-radius: 5px;
  background-color: #e2e6ff;

  &:hover {
    background-color: #c1c7ff;
  }
`;

const NotesPanel = styled.div`
  position: fixed;
  bottom: 60px;
  right: 260px;
  width: 300px;
  height: 200px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0 10px #888;
  padding: 10px;
  z-index: 50;

  h4 {
    margin-top: 0;
    margin-bottom: 8px;
  }

  textarea {
    width: 100%;
    height: 150px;
    resize: none;
    padding: 8px;
    font-size: 14px;
  }
`;
