import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import ProgramsList from './pages/ProgramsList';
import ProgramDetail from './pages/ProgramDetail';
import LessonEditor from './pages/LessonEditor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setUser(data);
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route
          path="/programs"
          element={user ? <ProgramsList user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/programs/:id"
          element={user ? <ProgramDetail user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/lessons/:id"
          element={user ? <LessonEditor user={user} /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to="/programs" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
