import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getThumbnailFallback } from '../utils/imageFallback';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const LANGUAGES = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi'];

function LessonEditor({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [assets, setAssets] = useState([]);
  const [newAsset, setNewAsset] = useState({ language: '', variant: 'portrait', assetType: 'thumbnail', url: '' });

  useEffect(() => {
    fetchLesson();
  }, [id]);

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/cms/lessons/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setLesson(data);
      setAssets(data.assets || []);
      setFormData({
        title: data.title,
        lessonNumber: data.lessonNumber,
        contentType: data.contentType,
        durationMs: data.durationMs || '',
        isPaid: data.isPaid,
        contentLanguagePrimary: data.contentLanguagePrimary,
        contentLanguagesAvailable: data.contentLanguagesAvailable,
        contentUrlsByLanguage: JSON.stringify(data.contentUrlsByLanguage, null, 2),
        subtitleLanguages: data.subtitleLanguages,
        subtitleUrlsByLanguage: JSON.stringify(data.subtitleUrlsByLanguage || {}, null, 2),
        status: data.status,
        publishAt: data.publishAt ? new Date(data.publishAt).toISOString().slice(0, 16) : '',
      });
    } catch (err) {
      console.error('Error fetching lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms/lessons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          durationMs: formData.durationMs ? parseInt(formData.durationMs) : null,
          contentUrlsByLanguage: JSON.parse(formData.contentUrlsByLanguage),
          subtitleUrlsByLanguage: JSON.parse(formData.subtitleUrlsByLanguage || '{}'),
          publishAt: formData.publishAt ? new Date(formData.publishAt).toISOString() : null,
        }),
      });
      if (res.ok) {
        await fetchLesson();
        alert('Lesson saved successfully');
      } else {
        const error = await res.json();
        alert(error.message || 'Error saving lesson');
      }
    } catch (err) {
      alert('Error saving lesson: ' + err.message);
    }
  };

  const handleAddAsset = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms/lessons/${id}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newAsset),
      });
      if (res.ok) {
        await fetchLesson();
        setNewAsset({ language: '', variant: 'portrait', assetType: 'thumbnail', url: '' });
      }
    } catch (err) {
      alert('Error adding asset: ' + err.message);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!confirm('Delete this asset?')) return;
    try {
      const res = await fetch(`${API_URL}/api/cms/lessons/${id}/assets/${assetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        await fetchLesson();
      }
    } catch (err) {
      alert('Error deleting asset: ' + err.message);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publish this lesson now?')) return;
    try {
      const res = await fetch(`${API_URL}/api/cms/lessons/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        await fetchLesson();
        alert('Lesson published successfully');
      } else {
        const error = await res.json();
        alert(error.message || 'Error publishing lesson');
      }
    } catch (err) {
      alert('Error publishing lesson: ' + err.message);
    }
  };

  const handleSchedule = async () => {
    if (!formData.publishAt) {
      alert('Please set publish date/time');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/cms/lessons/${id}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ publishAt: new Date(formData.publishAt).toISOString() }),
      });
      if (res.ok) {
        await fetchLesson();
        alert('Lesson scheduled successfully');
      } else {
        const error = await res.json();
        alert(error.message || 'Error scheduling lesson');
      }
    } catch (err) {
      alert('Error scheduling lesson: ' + err.message);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Archive this lesson?')) return;
    try {
      const res = await fetch(`${API_URL}/api/cms/lessons/${id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        await fetchLesson();
        alert('Lesson archived successfully');
      }
    } catch (err) {
      alert('Error archiving lesson: ' + err.message);
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (!lesson) return <div className="container">Lesson not found</div>;

  const canEdit = user.role === 'admin' || user.role === 'editor';
  const primaryAssets = assets.filter(a => a.language === lesson.contentLanguagePrimary && a.assetType === 'thumbnail');

  return (
    <div className="container">
      <div className="header">
        <Link to={`/programs/${lesson.term.program.id}`} className="btn btn-secondary">← Back to Program</Link>
      </div>

      <div className="card">
        <h1>{lesson.title}</h1>
        <div style={{ marginBottom: '16px' }}>
          <span className={`badge badge-${lesson.status}`}>{lesson.status}</span>
          {lesson.publishAt && (
            <span style={{ marginLeft: '8px' }}>
              Scheduled: {new Date(lesson.publishAt).toLocaleString()}
            </span>
          )}
          {lesson.publishedAt && (
            <span style={{ marginLeft: '8px' }}>
              Published: {new Date(lesson.publishedAt).toLocaleString()}
            </span>
          )}
        </div>

        {canEdit && (
          <div style={{ marginBottom: '16px' }}>
            <button onClick={handleSave} className="btn">Save Changes</button>
            {lesson.status === 'draft' && (
              <>
                <button onClick={handlePublish} className="btn btn-success" style={{ marginLeft: '8px' }}>Publish Now</button>
                <button onClick={handleSchedule} className="btn btn-secondary" style={{ marginLeft: '8px' }}>Schedule</button>
              </>
            )}
            {lesson.status !== 'archived' && (
              <button onClick={handleArchive} className="btn btn-danger" style={{ marginLeft: '8px' }}>Archive</button>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <>
          <div className="card">
            <h2>Lesson Details</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Lesson Number</label>
              <input
                type="number"
                value={formData.lessonNumber}
                onChange={(e) => setFormData({ ...formData, lessonNumber: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Content Type</label>
              <select
                value={formData.contentType}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
              >
                <option value="video">Video</option>
                <option value="article">Article</option>
              </select>
            </div>
            {formData.contentType === 'video' && (
              <div className="form-group">
                <label>Duration (ms)</label>
                <input
                  type="number"
                  value={formData.durationMs}
                  onChange={(e) => setFormData({ ...formData, durationMs: e.target.value })}
                />
              </div>
            )}
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                />
                Is Paid
              </label>
            </div>
            <div className="form-group">
              <label>Primary Content Language</label>
              <select
                value={formData.contentLanguagePrimary}
                onChange={(e) => setFormData({ ...formData, contentLanguagePrimary: e.target.value })}
              >
                <option value="">Select Language</option>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Available Content Languages</label>
              {LANGUAGES.map(lang => (
                <label key={lang} style={{ display: 'block', marginBottom: '4px' }}>
                  <input
                    type="checkbox"
                    checked={formData.contentLanguagesAvailable?.includes(lang)}
                    onChange={(e) => {
                      const langs = formData.contentLanguagesAvailable || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, contentLanguagesAvailable: [...langs, lang] });
                      } else {
                        setFormData({ ...formData, contentLanguagesAvailable: langs.filter(l => l !== lang) });
                      }
                    }}
                  />
                  {lang}
                </label>
              ))}
            </div>
            <div className="form-group">
              <label>Content URLs by Language (JSON)</label>
              <textarea
                value={formData.contentUrlsByLanguage}
                onChange={(e) => setFormData({ ...formData, contentUrlsByLanguage: e.target.value })}
                style={{ fontFamily: 'monospace', minHeight: '150px' }}
              />
            </div>
            <div className="form-group">
              <label>Subtitle Languages</label>
              {LANGUAGES.map(lang => (
                <label key={lang} style={{ display: 'block', marginBottom: '4px' }}>
                  <input
                    type="checkbox"
                    checked={formData.subtitleLanguages?.includes(lang)}
                    onChange={(e) => {
                      const langs = formData.subtitleLanguages || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, subtitleLanguages: [...langs, lang] });
                      } else {
                        setFormData({ ...formData, subtitleLanguages: langs.filter(l => l !== lang) });
                      }
                    }}
                  />
                  {lang}
                </label>
              ))}
            </div>
            <div className="form-group">
              <label>Subtitle URLs by Language (JSON, optional)</label>
              <textarea
                value={formData.subtitleUrlsByLanguage}
                onChange={(e) => setFormData({ ...formData, subtitleUrlsByLanguage: e.target.value })}
                style={{ fontFamily: 'monospace', minHeight: '100px' }}
              />
            </div>
            <div className="form-group">
              <label>Schedule Publish Date/Time (optional)</label>
              <input
                type="datetime-local"
                value={formData.publishAt}
                onChange={(e) => setFormData({ ...formData, publishAt: e.target.value })}
              />
            </div>
          </div>

          <div className="card">
            <h2>Thumbnails</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Required for primary language ({lesson.contentLanguagePrimary}): portrait and landscape
            </p>
            <div style={{ marginBottom: '16px' }}>
              {primaryAssets.length > 0 ? (
                primaryAssets.map(asset => (
                  <div key={asset.id} style={{ display: 'inline-block', marginRight: '16px', marginBottom: '16px' }}>
                    <img 
                      src={asset.url} 
                      alt={asset.variant} 
                      className={`thumbnail-preview ${asset.variant}`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getThumbnailFallback(lesson.title);
                      }}
                    />
                    <div style={{ fontSize: '12px' }}>
                      {asset.language} - {asset.variant}
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="btn btn-danger"
                        style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', background: '#f8f9fa', borderRadius: '4px' }}>
                  No thumbnails yet. Add thumbnails below.
                </div>
              )}
            </div>
            <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px' }}>
              <h3>Add Thumbnail</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                <select
                  value={newAsset.language}
                  onChange={(e) => setNewAsset({ ...newAsset, language: e.target.value })}
                >
                  <option value="">Select Language</option>
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <select
                  value={newAsset.variant}
                  onChange={(e) => setNewAsset({ ...newAsset, variant: e.target.value })}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                  <option value="square">Square</option>
                  <option value="banner">Banner</option>
                </select>
                <select
                  value={newAsset.assetType}
                  onChange={(e) => setNewAsset({ ...newAsset, assetType: e.target.value })}
                >
                  <option value="thumbnail">Thumbnail</option>
                </select>
                <input
                  placeholder="URL"
                  value={newAsset.url}
                  onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
                />
              </div>
              <button onClick={handleAddAsset} className="btn">Add Asset</button>
            </div>
          </div>
        </>
      )}

      {!canEdit && (
        <div className="card">
          <p>You don't have permission to edit this lesson.</p>
        </div>
      )}
    </div>
  );
}

export default LessonEditor;
