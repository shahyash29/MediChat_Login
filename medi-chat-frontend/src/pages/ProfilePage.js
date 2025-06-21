// src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate }       from 'react-router-dom';
import axios                 from 'axios';
import './ProfilePage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function ProfilePage() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/medichat', { replace: true });
        return;
      }
      try {
        const { data } = await axios.get(`${API_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(data.user);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/medichat', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return <p>Loading profile…</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>

      <div className="profile-field">
        <label>Name:</label>
        <span>{user.name}</span>
      </div>

      <div className="profile-field">
        <label>Email:</label>
        <span>{user.email}</span>
      </div>

      {user.role === 'patient' && (
        <>
          <div className="profile-field">
            <label>Date of Birth:</label>
            <span>{new Date(user.dob).toLocaleDateString()}</span>
          </div>
          <div className="profile-field">
            <label>Phone:</label>
            <span>{user.phone}</span>
          </div>
          <div className="profile-field">
            <label>Postal Code:</label>
            <span>{user.postalCode}</span>
          </div>
        </>
      )}

      {user.role === 'provider' && (
        <>
          <div className="profile-field">
            <label>Institution:</label>
            <span class="profile-span-field">{user.institutionName}</span>
          </div>
          <div className="profile-field">
            <label>Institution Email:</label>
            <span class="profile-span-field">{user.institutionEmail}</span>
          </div>
          <div className="profile-field">
            <label>Institution Phone:</label>
            <span class="profile-span-field">{user.institutionPhone}</span>
          </div>
          <div className="profile-field">
            <label>Address:</label>
            <span class="profile-span-field">
              {[user.address1, user.address2, user.city, user.stateCounty, user.postalCode, user.country]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        </>
      )}

      <button
        className="logout-button"
        onClick={() => {
          localStorage.removeItem('token');
          navigate('/medichat', { replace: true });
        }}
      >
        Logout
      </button>
    </div>
  );
}
