import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import '../css/AdminLogin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // ✅ new state
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated') || sessionStorage.getItem('adminAuthenticated');
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }

    const preventNavigation = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventNavigation);

    return () => {
      window.removeEventListener('popstate', preventNavigation);
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // ✅ start spinner

    try {
      const adminDocRef = doc(db, 'users', 'admin');
      const adminDoc = await getDoc(adminDocRef);

      if (adminDoc.exists()) {
        const { username: storedUsername, password: storedPassword } = adminDoc.data();

        if (username === storedUsername && password === storedPassword) {
          localStorage.setItem('adminAuthenticated', 'true');
          navigate('/admin', { replace: true });
        } else {
          setError('Invalid credentials. Please try again.');
        }
      } else {
        setError('Admin credentials are not set. Please contact support.');
      }
    } catch (error) {
      setError('Login failed: ' + error.message);
    } finally {
      setLoading(false); // ✅ stop spinner
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Admin Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="form-input"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
            disabled={loading}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="login-button" disabled={loading}>
          {loading && <div className="login-spinner" />}
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <button
          type="button"
          className="login-button"
          onClick={() => navigate('/')}
          disabled={loading}
          style={{ marginTop: '10px' }}
        >
          Home
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
