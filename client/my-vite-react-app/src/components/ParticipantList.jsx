import React from 'react';

export default function ParticipantList({ users, pinnedSocketId }) {
  return (
    <div className="participant-list" style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Participants ({users.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {users.map(({ socketId, userName }) => (
          <li key={socketId}
              style={{
                padding: '6px 8px',
                marginBottom: '4px',
                backgroundColor: socketId === pinnedSocketId ? '#cce5ff' : '#f9f9f9',
                borderRadius: '4px',
                fontWeight: socketId === pinnedSocketId ? 'bold' : 'normal',
              }}>
            {userName} {socketId === pinnedSocketId ? '📌' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
