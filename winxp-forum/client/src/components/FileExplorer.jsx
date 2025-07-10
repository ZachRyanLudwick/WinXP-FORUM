import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api.js';

const FileExplorer = ({ onOpenFile }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [renamingFile, setRenamingFile] = useState(null);
  const [newFileName, setNewFileName] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall('/api/files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall(`/api/files/${fileId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setFiles(files.filter(f => f._id !== fileId));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleRename = async (fileId, newName) => {
    if (!newName.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall(`/api/files/${fileId}/rename`, {
        method: 'PUT',
        body: JSON.stringify({ name: newName })
      });
      if (response.ok) {
        const updatedFile = await response.json();
        setFiles(files.map(f => f._id === fileId ? updatedFile : f));
        setRenamingFile(null);
      }
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  };

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file
    });
    setSelectedFile(file._id);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="loading">Loading files...</div>;
  }

  return (
    <div className="file-explorer" onClick={() => setContextMenu(null)}>
      {/* Toolbar */}
      <div className="file-toolbar">
        <button className="button" onClick={fetchFiles}>
          🔄 Refresh
        </button>
        <button className="button" onClick={() => onOpenFile(null)}>
          📝 New File
        </button>
      </div>

      {/* File List */}
      <div className="file-list">
        {files.length === 0 ? (
          <div className="no-files">
            <div>📁</div>
            <div>No files yet</div>
            <div>Create a new text file to get started</div>
          </div>
        ) : (
          <div className="file-grid">
            {files.map(file => (
              <div 
                key={file._id}
                className={`file-item ${selectedFile === file._id ? 'selected' : ''}`}
                onClick={() => setSelectedFile(file._id)}
                onDoubleClick={() => onOpenFile(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                <div className="file-icon">📄</div>
                {renamingFile === file._id ? (
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onBlur={() => handleRename(file._id, newFileName)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleRename(file._id, newFileName);
                      if (e.key === 'Escape') setRenamingFile(null);
                    }}
                    className="file-rename-input"
                    autoFocus
                  />
                ) : (
                  <div className="file-name">{file.name}</div>
                )}
                <div className="file-info">
                  <div>{formatFileSize(file.size)}</div>
                  <div>{new Date(file.updatedAt).toLocaleDateString()}</div>
                </div>
                <button 
                  className="file-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file._id);
                  }}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="file-status">
        <span>{files.length} file(s)</span>
        <span>
          {files.reduce((total, file) => total + file.size, 0)} bytes total
        </span>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div 
            className="context-menu-item"
            onClick={() => {
              onOpenFile(contextMenu.file);
              setContextMenu(null);
            }}
          >
            Open
          </div>
          <div 
            className="context-menu-item"
            onClick={() => {
              setRenamingFile(contextMenu.file._id);
              setNewFileName(contextMenu.file.name);
              setContextMenu(null);
            }}
          >
            Rename
          </div>
          <div 
            className="context-menu-item"
            onClick={() => {
              handleDelete(contextMenu.file._id);
              setContextMenu(null);
            }}
          >
            Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;