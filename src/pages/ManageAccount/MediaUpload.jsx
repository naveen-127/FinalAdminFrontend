import React, { useState, useEffect }                        from 'react';
import { Upload, Image as ImageIcon, Video, X, Trash2, Eye } from 'lucide-react';
import { API_BASE_URL }                                      from "../../config";
import './MediaUpload.css';

const MediaUpload = () => {
  const [activeTab, setActiveTab] = useState('posters');
  const [posters, setPosters] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Fetch existing media
  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/getMedia`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.status === 'success') {
        setPosters(data.posters || []);
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('media', file);
    });
    formData.append('type', type);

    try {
      const response = await fetch(`${API_BASE_URL}/uploadMedia`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert(`Successfully uploaded ${files.length} ${type}!`);
        fetchMedia();
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId, type) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/deleteMedia/${mediaId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('Media deleted successfully!');
        fetchMedia();
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error deleting media');
    }
  };

  const openPreview = (media) => {
    setSelectedMedia(media);
    setPreviewMode(true);
  };

  return (
    <div className="media-upload-container">
      <div className="media-upload-header">
        <h2>Media Manager</h2>
      </div>

      <div className="media-tabs">
        <button 
          className={`tab-btn ${activeTab === 'posters' ? 'active' : ''}`}
          onClick={() => setActiveTab('posters')}
        >
          <ImageIcon size={18} /> Posters ({posters.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <Video size={18} /> Videos ({videos.length})
        </button>
      </div>

      <div className="upload-area">
        <label className="upload-btn">
          <Upload size={20} />
          Upload {activeTab === 'posters' ? 'Posters' : 'Videos'}
          <input
            type="file"
            accept={activeTab === 'posters' ? 'image/*' : 'video/*'}
            multiple
            onChange={(e) => handleFileUpload(e, activeTab.slice(0, -1))}
            disabled={uploading}
          />
        </label>
        {uploading && <span className="uploading-text">Uploading...</span>}
      </div>

      <div className="media-grid">
        {loading ? (
          <div className="loading-state">Loading media...</div>
        ) : activeTab === 'posters' && posters.length === 0 ? (
          <div className="empty-state">
            <ImageIcon size={48} />
            <p>No posters uploaded yet</p>
            <small>Upload posters for courses, promotions, or announcements</small>
          </div>
        ) : activeTab === 'videos' && videos.length === 0 ? (
          <div className="empty-state">
            <Video size={48} />
            <p>No videos uploaded yet</p>
            <small>Upload tutorial videos, promotional content, or course materials</small>
          </div>
        ) : (
          (activeTab === 'posters' ? posters : videos).map((media) => (
            <div key={media._id} className="media-card">
              {activeTab === 'posters' ? (
                <div className="poster-preview">
                  <img 
                    src={media.url}  // ✅ Changed: removed API_BASE_URL prefix
                    alt={media.filename}
                    onClick={() => openPreview(media)}
                  />
                </div>
              ) : (
                <div className="video-preview">
                  <video 
                    src={media.url}  // ✅ Changed: removed API_BASE_URL prefix
                    onClick={() => openPreview(media)}
                  />
                  <div className="play-overlay">
                    <Video size={32} />
                  </div>
                </div>
              )}
              <div className="media-info">
                <span className="media-name" title={media.filename}>
                  {media.filename.length > 30 
                    ? media.filename.substring(0, 27) + '...' 
                    : media.filename}
                </span>
                <span className="media-size">
                  {(media.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="media-actions">
                <button 
                  className="preview-btn"
                  onClick={() => openPreview(media)}
                  title="Preview"
                >
                  <Eye size={16} />
                </button>
                <button 
                  className="delete-media-btn"
                  onClick={() => handleDelete(media._id, activeTab.slice(0, -1))}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {previewMode && selectedMedia && (
        <div className="preview-modal" onClick={() => setPreviewMode(false)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview" onClick={() => setPreviewMode(false)}>×</button>
            {activeTab === 'posters' ? (
              <img 
                src={selectedMedia.url}  // ✅ Changed: removed API_BASE_URL prefix
                alt={selectedMedia.filename}
                className="preview-image"
              />
            ) : (
              <video 
                src={selectedMedia.url}  // ✅ Changed: removed API_BASE_URL prefix
                controls
                autoPlay
                className="preview-video"
              />
            )}
            <div className="preview-info">
              <p><strong>Filename:</strong> {selectedMedia.filename}</p>
              <p><strong>Size:</strong> {(selectedMedia.size / 1024).toFixed(2)} KB</p>
              <p><strong>Uploaded:</strong> {new Date(selectedMedia.uploadedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;