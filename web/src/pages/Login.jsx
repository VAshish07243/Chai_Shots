import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Login({ setUser }) {
  const [email, setEmail] = useState('editor@example.com');
  const [password, setPassword] = useState('editor123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        navigate('/programs');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please check if API is running.');
    }
  };

  return (
    <div className="login-container">
      <div className="card">
        <h1>CMS Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn">Login</button>
        </form>
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p>Demo credentials:</p>
          <p>Admin: admin@example.com / admin123</p>
          <p>Editor: editor@example.com / editor123</p>
          <p>Viewer: viewer@example.com / viewer123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
