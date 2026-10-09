'use client';

import React, { useEffect, useState } from 'react';

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import Projects from '../components/Projects';
import Clients from '../components/Clients';
import Users from '../components/users';
import Archive from '../components/Archive';
import ProfileModal from '../components/ProfileModal';

export default function Home() {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  const [user, setUser] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error loading user session:', error);
      }
    }
  }, []);

  const isAdmin = user?.role === 'admin' || !user?.role;

  return (
    <div className="layout">

      <Sidebar
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        isAdmin={isAdmin}
      />

      <div className="main-wrapper">

        <Header
          username={user?.name || 'User'}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onProfileClick={() => setProfileOpen(true)}
        />

        <main className="main-content">

          {currentSection === 'dashboard' && (
            <Dashboard
              isAdmin={isAdmin}
            />
          )}

          {currentSection === 'projects' && (
            <Projects
              isAdmin={isAdmin}
              searchTerm={searchTerm}
            />
          )}

          {currentSection === 'clients' && isAdmin && (
            <Clients />
          )}

          {currentSection === 'users' && isAdmin && (
            <Users
              currentUserId={user?._id}
            />
          )}

          {currentSection === 'archive' && (
            <Archive
              isAdmin={isAdmin}
            />
          )}

        </main>
      </div>

      {profileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onSaved={(updatedUser) => {
            setUser(updatedUser);

            localStorage.setItem(
              'user_session',
              JSON.stringify(updatedUser)
            );

            setProfileOpen(false);
          }}
        />
      )}

    </div>
  );
}