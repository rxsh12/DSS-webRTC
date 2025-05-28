import React, { useCallback } from 'react';
import styled from 'styled-components';

const BottomBar = ({
  clickChat,
  clickCameraDevice,
  goToBack,
  toggleCameraAudio,
  userVideoAudio,
  clickScreenSharing,
  screenShare,
  videoDevices,
  showVideoDevices,
  setShowVideoDevices,
}) => {
  const handleToggle = useCallback(() => {
    setShowVideoDevices((state) => !state);
  }, [setShowVideoDevices]);

  return (
    <Bar>
      <Left>
        <CameraButton
          type="button"
          onClick={toggleCameraAudio}
          data-switch="video"
          aria-label={userVideoAudio.video ? 'Turn off camera' : 'Turn on camera'}
        >
          <div>
            {userVideoAudio.video ? (
              <FaIcon className="fas fa-video" aria-hidden="true"></FaIcon>
            ) : (
              <FaIcon className="fas fa-video-slash" aria-hidden="true"></FaIcon>
            )}
          </div>
          Camera
        </CameraButton>

        {showVideoDevices && (
          <SwitchList role="listbox" aria-label="Select video device">
            {videoDevices.length > 0 &&
              videoDevices.map((device) => (
                <SwitchItem
                  key={device.deviceId}
                  onClick={(e) => clickCameraDevice(e.currentTarget.dataset.value)}
                  data-value={device.deviceId}
                  role="option"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      clickCameraDevice(e.currentTarget.dataset.value);
                    }
                  }}
                >
                  {device.label}
                </SwitchItem>
              ))}
            <SwitchLabel>Switch Camera</SwitchLabel>
          </SwitchList>
        )}

        <SwitchMenu
          type="button"
          onClick={handleToggle}
          aria-label={showVideoDevices ? 'Hide video devices' : 'Show video devices'}
        >
          <i className="fas fa-angle-up" aria-hidden="true"></i>
        </SwitchMenu>

        <CameraButton
          type="button"
          onClick={toggleCameraAudio}
          data-switch="audio"
          aria-label={userVideoAudio.audio ? 'Mute microphone' : 'Unmute microphone'}
        >
          <div>
            {userVideoAudio.audio ? (
              <FaIcon className="fas fa-microphone" aria-hidden="true"></FaIcon>
            ) : (
              <FaIcon className="fas fa-microphone-slash" aria-hidden="true"></FaIcon>
            )}
          </div>
          Audio
        </CameraButton>
      </Left>

      <Center>
        <ChatButton
          type="button"
          onClick={clickChat}
          aria-label="Open chat"
        >
          <div>
            <FaIcon className="fas fa-comments" aria-hidden="true"></FaIcon>
          </div>
          Chat
        </ChatButton>

        <ScreenButton
          type="button"
          onClick={clickScreenSharing}
          aria-pressed={screenShare}
          aria-label={screenShare ? 'Stop screen sharing' : 'Start screen sharing'}
        >
          <div>
            <FaIcon
              className={`fas fa-desktop ${screenShare ? 'sharing' : ''}`}
              aria-hidden="true"
            ></FaIcon>
          </div>
          Share Screen
        </ScreenButton>
      </Center>

      <Right>
        <StopButton
          type="button"
          onClick={goToBack}
          aria-label="Stop and leave meeting"
        >
          Stop
        </StopButton>
      </Right>
    </Bar>
  );
};

const Bar = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 8%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  background-color: #4ea1d3;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  margin-left: 15px;
`;

const Center = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const Right = styled.div``;

const ChatButton = styled.button`
  width: 75px;
  border: none;
  font-size: 0.9375rem;
  padding: 5px;
  background: none;
  color: inherit;

  :hover {
    background-color: #77b7dd;
    cursor: pointer;
    border-radius: 15px;
  }

  * {
    pointer-events: none;
  }
`;

const ScreenButton = styled.button`
  width: auto;
  border: none;
  font-size: 0.9375rem;
  padding: 5px;
  background: none;
  color: inherit;

  :hover {
    background-color: #77b7dd;
    cursor: pointer;
    border-radius: 15px;
  }

  .sharing {
    color: #ee2560;
  }
`;

const FaIcon = styled.i`
  width: 30px;
  font-size: calc(16px + 1vmin);
`;

const StopButton = styled.button`
  width: 75px;
  height: 30px;
  border: none;
  font-size: 0.9375rem;
  line-height: 30px;
  margin-right: 15px;
  background-color: #ee2560;
  color: white;
  border-radius: 15px;

  :hover {
    background-color: #f25483;
    cursor: pointer;
  }
`;

const CameraButton = styled.button`
  position: relative;
  width: 75px;
  border: none;
  font-size: 0.9375rem;
  padding: 5px;
  background: none;
  color: inherit;

  :hover {
    background-color: #77b7dd;
    cursor: pointer;
    border-radius: 15px;
  }

  * {
    pointer-events: none;
  }

  .fa-microphone-slash {
    color: #ee2560;
  }

  .fa-video-slash {
    color: #ee2560;
  }
`;

const SwitchMenu = styled.button`
  display: flex;
  position: absolute;
  width: 20px;
  top: 7px;
  left: 80px;
  z-index: 1;
  border: none;
  background: none;
  color: inherit;

  :hover {
    background-color: #476d84;
    cursor: pointer;
    border-radius: 15px;
  }

  * {
    pointer-events: none;
  }

  > i {
    width: 90%;
    font-size: calc(10px + 1vmin);
  }
`;

const SwitchList = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: -65.95px;
  left: 80px;
  background-color: #4ea1d3;
  color: white;
  padding: 5px 10px;
  text-align: left;
  z-index: 10;
`;

const SwitchItem = styled.div`
  font-size: 0.85rem;
  padding: 1px;
  margin-bottom: 5px;
  cursor: pointer;

  :hover {
    background-color: #77b7dd;
  }

  :focus {
    outline: 2px solid #77b7dd;
  }
`;

const SwitchLabel = styled.div`
  font-size: 0.85rem;
  padding: 1px;
  margin-bottom: 0;
  border-top: 1px solid white;
  cursor: default;
  user-select: none;
`;

export default BottomBar;
