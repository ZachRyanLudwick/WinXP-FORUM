import React, { useState } from 'react';
import LoginRequired from './LoginRequired';

// Simple rich text editor component
const RichTextEditor = ({ value, onChange, placeholder, onToggleFileManager }) => {
  const [showToolbar, setShowToolbar] = useState(false);
  
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
          height: '200px',
          border: 'none',
          padding: '12px',
          resize: 'none',
          fontFamily: 'monospace',
          fontSize: '12px',
          outline: 'none'
        }}
      />
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
    formData.append('image', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
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
    const imageTag = `![${attachment.originalName}](http://localhost:5001/uploads/${attachment.filename})`;
    insertText(imageTag);
  };

  const insertFile = (attachment) => {
    const fileTag = `[📎 ${attachment.originalName}](http://localhost:5001/uploads/${attachment.filename})`;
    insertText(fileTag);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Check if user is admin by trying admin endpoint first, fallback to community
      let response = await fetch('http://localhost:5001/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
        response = await fetch('http://localhost:5001/api/posts/community', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
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
                      src={`http://localhost:5001/uploads/${attachment.filename}`}
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