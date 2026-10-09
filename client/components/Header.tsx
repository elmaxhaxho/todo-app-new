'use client';

import { useState } from 'react';

export default function Header({
  username,
  searchTerm,
  setSearchTerm,
  onProfileClick
}: any) {

  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <header className="header">

      <div className="search-container">

        <input
          type="text"
          className="search-bar"
          placeholder="Search projects or tasks..."
          value={searchTerm || ''}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
        />

      </div>

    <button
    className="dark-mode-btn"
    onClick={toggleDarkMode}
    >
    <span className="dark-mode-icon">
        {darkMode ? '☀' : '☾'}
    </span>
    <span>
        {darkMode ? 'Light Mode' : 'Dark Mode'}
    </span>
    </button>

      <div
        className="profile"
        onClick={onProfileClick}
        style={{ cursor: 'pointer' }}
      >

        <div className="profile-picture">
          <img
            src="/profile.jpg"
            alt="Profile picture"
          />
        </div>

        <span className="username">
          {username || 'User'}
        </span>

      </div>

    </header>
  );
}