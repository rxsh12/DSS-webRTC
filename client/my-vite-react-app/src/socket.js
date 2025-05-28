import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000'; // Change if deployed elsewhere

const socket = io(SOCKET_SERVER_URL, {
  transports: ['websocket'],
});

export default socket;
