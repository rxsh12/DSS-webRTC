import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import socket from '../../socket';
import { useHistory } from 'react-router-dom';

// Generate random room ID
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 10);
};

const Main = () => {
  const roomRef = useRef();
  const userRef = useRef();
  const history = useHistory();

  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [pendingRoom, setPendingRoom] = useState('');
  const [pendingUser, setPendingUser] = useState('');

  useEffect(() => {
    const errorListener = ({ error }) => {
      if (!error) {
        sessionStorage.setItem('user', pendingUser);
        history.push(`/room/${pendingRoom}`);
      } else {
        setErr(true);
        setErrMsg('User name already exists');
      }
    };

    socket.on('FE-error-user-exist', errorListener);
    return () => {
      socket.off('FE-error-user-exist', errorListener);
    };
  }, [history, pendingRoom, pendingUser]);

  const clickJoin = () => {
    const roomName = roomRef.current?.value.trim();
    const userName = userRef.current?.value.trim();

    if (!roomName || !userName) {
      setErr(true);
      setErrMsg('Enter Room Name and User Name');
      return;
    }

    setErr(false);
    setErrMsg('');
    setPendingRoom(roomName);
    setPendingUser(userName);

    socket.emit('BE-check-user', { roomId: roomName, userName });
  };

  const startNewMeeting = () => {
    const newRoomId = generateRoomId();
    setGeneratedRoomId(newRoomId);
    roomRef.current.value = newRoomId;
  };

  const copyLinkToClipboard = () => {
    const link = `${window.location.origin}/room/${generatedRoomId}`;
    navigator.clipboard.writeText(link);
    alert('Room link copied to clipboard!');
  };

  return (
    <MainWrapper>
      <TextSection>
        <Title>DentalPaas</Title>
        <Subtitle>Dental Web Conference Portal</Subtitle>

        <ButtonRow>
          <StartButton onClick={startNewMeeting}>Start New Meeting</StartButton>
          {generatedRoomId && (
            <>
              <RoomLink>
                Share this room link:{' '}
                <LinkText>{`${window.location.origin}/room/${generatedRoomId}`}</LinkText>
              </RoomLink>
              <CopyButton onClick={copyLinkToClipboard}>Copy Link</CopyButton>
            </>
          )}
        </ButtonRow>

        <Row>
          <Label htmlFor="roomName">Room Name</Label>
          <Input type="text" id="roomName" ref={roomRef} />
        </Row>
        <Row>
          <Label htmlFor="userName">User Name</Label>
          <Input type="text" id="userName" ref={userRef} />
        </Row>
        <JoinButton onClick={clickJoin}>Join</JoinButton>
        {err && <Error>{errMsg}</Error>}
      </TextSection>

      <SideImage src="/landing-image.jpg" alt="Dental Telemedicine" />
    </MainWrapper>
  );
};

// Styled Components
const MainWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 60px 100px;
  min-height: 100vh;
  background-color: #f4fbfe;
`;

const TextSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 700;
  color: #4ea1d3;
`;

const Subtitle = styled.h2`
  font-size: 24px;
  font-weight: 400;
  margin-bottom: 30px;
  color: #333;
`;

const SideImage = styled.img`
  flex: 1;
  max-width: 500px;
  height: auto;
  margin-left: 50px;
  border-radius: 20px;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.1);
`;

const ButtonRow = styled.div`
  margin-bottom: 25px;
`;

const StartButton = styled.button`
  background-color: #4ea1d3;
  color: #d8e9ef;
  font-size: 20px;
  padding: 10px 20px;
  border-radius: 15px;
  border: none;
  cursor: pointer;
  margin-bottom: 10px;

  :hover {
    background-color: #7bb1d1;
  }
`;

const RoomLink = styled.div`
  margin: 10px 0;
  font-size: 16px;
  color: #4a90e2;
  word-break: break-word;
`;

const LinkText = styled.span`
  font-weight: 600;
`;

const CopyButton = styled.button`
  background-color: #2c7abf;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 6px 15px;
  font-size: 14px;
  cursor: pointer;

  :hover {
    background-color: #145a8a;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  margin-top: 15px;
  line-height: 35px;
`;

const Label = styled.label`
  font-size: 18px;
`;

const Input = styled.input`
  width: 200px;
  height: 35px;
  margin-left: 15px;
  padding-left: 10px;
  outline: none;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const JoinButton = styled.button`
  height: 40px;
  margin-top: 35px;
  border: none;
  border-radius: 15px;
  color: #fff;
  background-color: #4ea1d3;
  font-size: 20px;
  padding: 0 30px;
  cursor: pointer;

  :hover {
    background-color: #7bb1d1;
  }
`;

const Error = styled.div`
  margin-top: 10px;
  font-size: 18px;
  color: #e85a71;
`;

export default Main;
