import React, { useState, useEffect } from 'react';

export default function MeetingNotes({ roomId, socket }) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!socket) return;
    socket.on('meeting-notes-updated', ({ notes }) => setNotes(notes));
    return () => socket.off('meeting-notes-updated');
  }, [socket]);

  const handleChange = (e) => {
    const updatedNotes = e.target.value;
    setNotes(updatedNotes);
    socket.emit('meeting-notes-update', { roomId, notes: updatedNotes });
  };

  return (
    <div className="meeting-notes" style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Meeting Notes</h3>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Write meeting notes here..."
        style={{ width: '100%', height: '150px', resize: 'none', padding: '8px' }}
      />
    </div>
  );
}
