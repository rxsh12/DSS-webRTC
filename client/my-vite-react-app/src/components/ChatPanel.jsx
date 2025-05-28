import React, { useState, useEffect } from 'react';

export default function ChatPanel({ socket, userName }) {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  useEffect(() => {
    if (!socket) return;
    socket.on('receive-message', ({ user, text }) => {
      setChat((prev) => [...prev, { user, text }]);
    });
    return () => socket.off('receive-message');
  }, [socket]);

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit('send-message', { user: userName, text: message });
    setMessage('');
  };

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '10px' }}>
      <h3>Chat</h3>
      <div style={{ height: '150px', overflowY: 'scroll', marginBottom: '10px' }}>
        {chat.map((msg, idx) => (
          <div key={idx}><strong>{msg.user}:</strong> {msg.text}</div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Type your message..."
        style={{ width: '80%', marginRight: '5px' }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
