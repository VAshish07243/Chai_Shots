import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosterFallback } from '../utils/imageFallback';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const LANGUAGES = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi'];

function ProgramsList({ user, setUser }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', language: '', topic: '' });
  const [topics, setTopics] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopics();
    fetchPrograms();
  }, [filters]);

  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms/topics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setTopics(data);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.language) params.append('language', filters.language);
      if (filters.topic) params.append('topic', filters.topic);

      const res = await fetch(`${API_URL}/api/cms/programs?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setPrograms(data);
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPosterUrl = (program) => {
    const primaryPoster = program.assets?.find(
      a => a.language === program.languagePrimary && a.variant === 'portrait' && a.assetType === 'poster'
    );
    return primaryPoster?.url || getPosterFallback(program.title);
  };

  const handleImageError = (e, program) => {
    e.target.onerror = null; // prevent infinite loop
    e.target.src = getPosterFallback(program.title);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="header">
        <div className="header-actions">
          <h1>Programs</h1>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
        <p>Logged in as {user.email} ({user.role})</p>
      </div>

      <div className="card">
        <h2>Filters</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className="form-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="form-group">
            <label>Language</label>
            <select
              value={filters.language}
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            >
              <option value="">All</option>
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Topic</label>
            <select
              value={filters.topic}
              onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
            >
              <option value="">All</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.name}>{topic.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid">
        {programs.map(program => (
          <div key={program.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/programs/${program.id}`)}>
            <img 
              src={getPosterUrl(program)} 
              alt={program.title} 
              className="poster-preview"
              onError={(e) => handleImageError(e, program)}
            />
            <h3>{program.title}</h3>
            <p style={{ color: '#666', marginBottom: '8px' }}>{program.description}</p>
            <div>
              <span className={`badge badge-${program.status}`}>{program.status}</span>
              <span style={{ marginLeft: '8px', fontSize: '14px', color: '#666' }}>
                {program.languagePrimary}
              </span>
            </div>
          </div>
        ))}
      </div>

      {programs.length === 0 && <div className="card">No programs found</div>}
    </div>
  );
}

export default ProgramsList;
