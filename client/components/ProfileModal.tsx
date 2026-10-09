'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileModal({
  user,
  onClose,
  onSaved
}: any) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPassword('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      alert('Name and email are required.');
      return;
    }

    if (password && password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/profile`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.message === 'Invalid or expired session' || res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
          router.push('/login');
          return;
        }

        alert(
          data.message ||
          'Could not update your profile.'
        );
        return;
      }

      localStorage.setItem(
        'user_session',
        JSON.stringify(data.user)
      );

      onSaved(data.user);

    } catch (error: any) {
      console.error('Profile update error:', error);
      alert('Could not connect to the server.');

    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div
        className="profile-modal-overlay"
        onClick={onClose}
      >
        <div
          className="profile-loading"
          onClick={(e) => e.stopPropagation()}
        >
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="profile-modal-overlay"
      onClick={onClose}
    >

      <div
        className="profile-modal"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="profile-modal-header">

          <h2>
            My Profile
          </h2>

          <button
            className="profile-close-btn"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        <div className="profile-modal-picture">
          <img
            src="/profile.jpg"
            alt="Profile picture"
          />
        </div>

        <div className="profile-input-group">

          <label>
            Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

        </div>

        <div className="profile-input-group">

          <label>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

        </div>

        <div className="profile-input-group">

          <label>
            Change Password
          </label>

          <input
            type="password"
            value={password}
            placeholder="Leave blank to keep current password"
            onChange={(e) => setPassword(e.target.value)}
          />

        </div>

        <div className="profile-role">

          Role:{' '}

          <strong>
            {user.role === 'admin'
              ? 'Admin'
              : 'Employee'}
          </strong>

        </div>

        <div className="profile-modal-actions">

          <button
            className="profile-cancel-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="profile-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

        </div>

      </div>

    </div>
  );
}