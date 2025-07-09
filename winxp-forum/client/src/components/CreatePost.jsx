import React, { useState } from 'react';
import LoginRequired from './LoginRequired';
import { apiCall, API_URL } from '../utils/api';

// Simple rich text editor component
const RichTextEditor = ({ value, onChange, placeholder, onToggleFileManager }) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [imagePreviewSizes, setImagePreviewSizes] = useState({});
  
  const insertText = (before, after = '') => {
    const textarea = document.getElementById('content-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };
  
  // Extract images from content for preview
  const getImagesFromContent = () => {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;
    while ((match = imageRegex.exec(value)) !== null) {
      images.push({
        alt: match[1],
        src: match[2],
        fullMatch: match[0]
      });
    }
    return images;
  };

  const updateImageSize = (imageSrc, newSize) => {
    setImagePreviewSizes(prev => ({ ...prev, [imageSrc]: newSize }));
  };

  const replaceImageWithSizedVersion = (imageSrc, size) => {
    const imageRegex = new RegExp(`!\\[([^\\]]*)\\]\\(${imageSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
    const newContent = value.replace(imageRegex, `<img src="${imageSrc}" alt="$1" style="width:${size}px;height:auto;margin:8px 0;border:1px solid #ddd;border-radius:4px;" />`);
    onChange(newContent);
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '4px' }}>
      <div style={{ 
        background: '#f5f5f5', 
        padding: '8px', 
        borderBottom: '1px solid #ccc',
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap'
      }}>
        <button type="button" className="button" onClick={() => insertText('**', '**')} title="Bold">
          <b>B</b>
        </button>
        <button type="button" className="button" onClick={() => insertText('*', '*')} title="Italic">
          <i>I</i>
        </button>
        <button type="button" className="button" onClick={() => insertText('`', '`')} title="Code">
          {'<>'}
        </button>
        <button type="button" className="button" onClick={() => insertText('\n```\n', '\n```\n')} title="Code Block">
          {'{}'}
        </button>
        <button type="button" className="button" onClick={() => insertText('- ')} title="List">
          •
        </button>
        <button type="button" className="button" onClick={() => insertText('## ')} title="Header">
          H
        </button>
        <button type="button" className="button" onClick={onToggleFileManager} title="Files">
          📎
        </button>
      </div>
      <textarea
        id="content-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '150px',
          border: 'none',
          padding: '12px',
          resize: 'none',
          fontFamily: 'monospace',
          fontSize: '12px',
          outline: 'none'
        }}
      />
      {/* Image Preview Section */}
      {getImagesFromContent().length > 0 && (
        <div style={{ 
          borderTop: '1px solid #ccc', 
          padding: '12px', 
          background: '#f9f9f9',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>Image Previews:</div>
          {getImagesFromContent().map((image, index) => {
            const currentSize = imagePreviewSizes[image.src] || 300;
            return (
              <div key={index} style={{ marginBottom: '12px', padding: '8px', background: 'white', border: '1px solid #ddd', borderRadius: '4px' }}>
                <img 
                  src={image.src} 
                  alt={image.alt}
                  style={{ 
                    width: currentSize + 'px', 
                    height: 'auto', 
                    display: 'block', 
                    marginBottom: '8px',
                    border: '1px solid #ccc'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', minWidth: '40px' }}>Size:</span>
                  <input 
                    type="range" 
                    min="100" 
                    max="600" 
                    value={currentSize}
                    onChange={(e) => updateImageSize(image.src, parseInt(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '10px', minWidth: '40px' }}>{currentSize}px</span>
                  <button 
                    type="button"
                    className="button"
                    onClick={() => replaceImageWithSizedVersion(image.src, currentSize)}
                    style={{ fontSize: '9px', padding: '2px 6px' }}
                  >
                    Apply Size
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CreatePost = ({ onPostCreated, user, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('general');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showFileManager, setShowFileManager] = useState(false);
  
  const loginRequired = (
    <LoginRequired 
      user={user}
      onClose={onClose}
      appName="Create Post"
      appIcon="✏️"
      description="Please create an account or login to create and share posts"
    />
  );
  
  if (!user) return loginRequired;

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall('/api/upload', {
        method: 'POST',
        headers: {},
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttachments(prev => [...prev, data]);
        return data;
      }
    } catch (error) {
      console.error('File upload failed:', error);
    }
    return null;
  };

  const insertText = (text) => {
    const textarea = document.getElementById('content-editor');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + text + content.substring(end);
      setContent(newContent);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    }
  };

  const insertImage = (attachment) => {
    const imageTag = `![${attachment.originalName}](${API_URL}/uploads/${attachment.filename})`;
    insertText(imageTag);
  };

  const insertFile = (attachment) => {
    const fileTag = `[📎 ${attachment.originalName}](${API_URL}/api/download/${attachment.filename})`;
    insertText(fileTag);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Check if user is admin by trying admin endpoint first, fallback to community
      let response = await apiCall('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ 
          title, 
          content, 
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          category,
          attachments
        })
      });

      // If admin endpoint fails, try community endpoint
      if (!response.ok && response.status === 403) {
        response = await apiCall('/api/posts/community', {
          method: 'POST',
          body: JSON.stringify({ 
            title, 
            content, 
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            category,
            attachments
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }

      onPostCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="general">🔍 General</option>
            <option value="vulnerability">🚨 Vulnerability</option>
            <option value="malware">🦠 Malware Analysis</option>
            <option value="network">🌐 Network Security</option>
            <option value="forensics">🔬 Digital Forensics</option>
            <option value="tools">🛠️ Security Tools</option>
            <option value="tutorial">📚 Tutorial</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            className="form-input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="CVE-2024-1234, RCE, Windows, etc..."
          />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Content</label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            onToggleFileManager={() => setShowFileManager(!showFileManager)}
            placeholder="Write your cybersecurity findings here...\n\nSupported formatting:\n**bold** *italic* `code` \n```code block```\n- list items\n## headers"
          />
        </div>

        {showFileManager && (
          <div style={{ 
            border: '1px solid #ccc', 
            borderRadius: '4px', 
            padding: '8px', 
            marginBottom: '8px',
            background: '#f9f9f9'
          }}>
            <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>File Manager</div>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
              onChange={async (e) => {
                for (let file of e.target.files) {
                  await handleFileUpload(file);
                }
                e.target.value = '';
              }}
              style={{ marginBottom: '8px', fontSize: '10px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
              {attachments.map((attachment, index) => (
                <div key={index} style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  padding: '4px',
                  background: 'white',
                  textAlign: 'center'
                }}>
                  {attachment.isImage ? (
                    <img 
                      src={`${API_URL}/uploads/${attachment.filename}`}
                      alt={attachment.originalName}
                      style={{ width: '100%', height: '60px', objectFit: 'cover', marginBottom: '4px' }}
                    />
                  ) : (
                    <div style={{ 
                      height: '60px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '24px',
                      marginBottom: '4px'
                    }}>
                      📄
                    </div>
                  )}
                  <div style={{ fontSize: '9px', marginBottom: '4px', wordBreak: 'break-all' }}>
                    {attachment.originalName}
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button 
                      type="button" 
                      className="button"
                      onClick={() => attachment.isImage ? insertImage(attachment) : insertFile(attachment)}
                      style={{ fontSize: '8px', padding: '2px 4px' }}
                    >
                      Insert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button 
            type="submit" 
            className="button primary"
            disabled={loading}
          >
            {loading ? 'Publishing...' : '📝 Publish Post'}
          </button>
          <button 
            type="button" 
            className="button"
            onClick={() => {
              setTitle('');
              setContent('');
              setTags('');
              setCategory('general');
            }}
          >
            🗑️ Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;