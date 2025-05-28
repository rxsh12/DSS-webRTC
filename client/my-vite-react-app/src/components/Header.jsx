import React from 'react';
import './Header.css';

const Header = ({ roomId }) => (
  <header className="header">
    <div className="header-left">
      <img
        src="/dental-tooth-icon.png"
        alt="DentalPaas Logo"
        className="header-logo"
      />
      <h1 className="header-title">DentalPaas</h1>
    </div>
    <div className="header-right">
      <span className="room-id-label">Room ID:</span>
      <span className="room-id-value">{roomId}</span>
    </div>
  </header>
);

export default Header;
