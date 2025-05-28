import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';


export default function LandingPage() {
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

const createMeeting = () => {
  const newRoomId = uuid();
  console.log('Creating meeting:', newRoomId, 'with name:', name);
  navigate(`/room/${newRoomId}`, { state: { name: name || 'Anonymous' } });
};

const joinMeeting = () => {
  if (!roomId.trim()) return alert('Enter Room ID');
  if (!name.trim()) return alert('Enter your name');
  console.log('Joining meeting:', roomId, 'with name:', name);
  navigate(`/room/${roomId}`, { state: { name } });
};


  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e3f2fd' }}>
      <div style={{ maxWidth: 600, background: '#fff', padding: 30, borderRadius: 12, boxShadow: '0 0 15px rgba(0,0,0,0.1)' }}>
        <img src="/landing-image.jpg" alt="Dental Meeting" style={{ width: '100%', borderRadius: 12, marginBottom: 20 }} />
        <h2 style={{ textAlign: 'center' }}>DentalPaas Video Consult</h2>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', marginBottom: 10, padding: 10, borderRadius: 6 }}
        />
        <input
          type="text"
          placeholder="Room ID (for joining)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ width: '100%', marginBottom: 10, padding: 10, borderRadius: 6 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={createMeeting} style={{ padding: 10, borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none' }}>
            Create Meeting
          </button>
          <button onClick={joinMeeting} style={{ padding: 10, borderRadius: 6, background: '#388e3c', color: '#fff', border: 'none' }}>
            Join Meeting
          </button>
        </div>
      </div>
    </div>
  );
}
