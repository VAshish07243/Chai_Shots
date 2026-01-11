import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const LANGUAGES = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi'];

function ProgramDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [topics, setTopics] = useState([]);
  const [newTermNumber, setNewTermNumber] = useState(1);

  useEffect(() => {
    fetchProgram();
    fetchTopics();
  }, [id]);

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

  const fetchProgram = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/cms/programs/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setProgram(data);
      setFormData({
        title: data.title,
        description: data.description || '',
        languagePrimary: data.languagePrimary,
        languagesAvailable: data.languagesAvailable,
        topicIds: data.topics.map(pt => pt.topicId),
      });
    } catch (err) {
      console.error('Error fetching program:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms/programs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
        }),
      });
      if (res.ok) {
        await fetchProgram();
        setEditing(false);
      }
    } catch (err) {
      console.error('Error saving program:', err);
    }
  };

  const handleCreateTerm = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms/programs/${id}/terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ termNumber: newTermNumber }),
      });
      if (res.ok) {
        await fetchProgram();
        setNewTermNumber(newTermNumber + 1);
      }
    } catch (err) {
      console.error('Error creating term:', err);
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (!program) return <div className="container">Program not found</div>;

  const canEdit = user.role === 'admin' || user.role === 'editor';

  return (
    <div className="container">
      <div className="header">
        <Link to="/programs" className="btn btn-secondary">← Back to Programs</Link>
      </div>

      <div className="card">
        {!editing ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1>{program.title}</h1>
                <p style={{ color: '#666', marginBottom: '16px' }}>{program.description}</p>
                <div>
                  <span className={`badge badge-${program.status}`}>{program.status}</span>
                  <span style={{ marginLeft: '8px' }}>Primary: {program.languagePrimary}</span>
                  <span style={{ marginLeft: '8px' }}>Available: {program.languagesAvailable.join(', ')}</span>
                </div>
              </div>
              {canEdit && (
                <button onClick={() => setEditing(true)} className="btn">Edit</button>
              )}
            </div>
          </>
        ) : (
          <>
            <h2>Edit Program</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Primary Language</label>
              <select
                value={formData.languagePrimary}
                onChange={(e) => setFormData({ ...formData, languagePrimary: e.target.value })}
              >
                <option value="">Select Language</option>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Available Languages</label>
              {LANGUAGES.map(lang => (
                <label key={lang} style={{ display: 'block', marginBottom: '4px' }}>
                  <input
                    type="checkbox"
                    checked={formData.languagesAvailable?.includes(lang)}
                    onChange={(e) => {
                      const langs = formData.languagesAvailable || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, languagesAvailable: [...langs, lang] });
                      } else {
                        setFormData({ ...formData, languagesAvailable: langs.filter(l => l !== lang) });
                      }
                    }}
                  />
                  {lang}
                </label>
              ))}
            </div>
            <div className="form-group">
              <label>Topics</label>
              {topics.map(topic => (
                <label key={topic.id} style={{ display: 'block', marginBottom: '4px' }}>
                  <input
                    type="checkbox"
                    checked={formData.topicIds?.includes(topic.id)}
                    onChange={(e) => {
                      const topicIds = formData.topicIds || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, topicIds: [...topicIds, topic.id] });
                      } else {
                        setFormData({ ...formData, topicIds: topicIds.filter(id => id !== topic.id) });
                      }
                    }}
                  />
                  {topic.name}
                </label>
              ))}
            </div>
            <div>
              <button onClick={handleSave} className="btn">Save</button>
              <button onClick={() => setEditing(false)} className="btn btn-secondary" style={{ marginLeft: '8px' }}>Cancel</button>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2>Terms</h2>
        {canEdit && (
          <div style={{ marginBottom: '16px' }}>
            <input
              type="number"
              value={newTermNumber}
              onChange={(e) => setNewTermNumber(parseInt(e.target.value))}
              style={{ width: '100px', marginRight: '8px' }}
            />
            <button onClick={handleCreateTerm} className="btn">Create Term</button>
          </div>
        )}
        {program.terms.map(term => (
          <div key={term.id} style={{ marginBottom: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '4px' }}>
            <h3>Term {term.termNumber} {term.title && `- ${term.title}`}</h3>
            <div style={{ marginTop: '8px' }}>
              <strong>Lessons:</strong>
              <table className="table" style={{ marginTop: '8px' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {term.lessons.map(lesson => (
                    <tr key={lesson.id}>
                      <td>{lesson.lessonNumber}</td>
                      <td>
                        <Link to={`/lessons/${lesson.id}`}>{lesson.title}</Link>
                      </td>
                      <td>
                        <span className={`badge badge-${lesson.status}`}>{lesson.status}</span>
                      </td>
                      <td>{lesson.contentType}</td>
                      <td>
                        {lesson.publishAt && <div style={{ fontSize: '12px' }}>Scheduled: {new Date(lesson.publishAt).toLocaleString()}</div>}
                        {lesson.publishedAt && <div style={{ fontSize: '12px' }}>Published: {new Date(lesson.publishedAt).toLocaleString()}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgramDetail;
