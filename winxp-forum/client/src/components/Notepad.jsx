import React, { useState, useRef } from 'react';

const Notepad = ({ initialFile = null }) => {
  const [content, setContent] = useState(initialFile?.content || '');
  const [fileName, setFileName] = useState(initialFile?.name || 'Untitled');
  const [isModified, setIsModified] = useState(false);
  const [fileId, setFileId] = useState(initialFile?._id || null);
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const textareaRef = useRef(null);

  const handleTextChange = (e) => {
    setContent(e.target.value);
    setIsModified(true);
  };

  const handleNew = () => {
    if (isModified && !confirm('You have unsaved changes. Continue?')) return;
    setContent('');
    setFileName('Untitled');
    setIsModified(false);
  };

  const handleSave = () => {
    if (fileId) {
      // File exists, save directly
      saveFile(fileName);
    } else {
      // New file, show save dialog
      setShowSaveDialog(true);
    }
  };

  const saveFile = async (name) => {
    const finalName = name.endsWith('.txt') ? name : `${name}.txt`;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: finalName, content })
      });
      
      if (response.ok) {
        const savedFile = await response.json();
        setFileId(savedFile._id);
        setFileName(savedFile.name.replace('.txt', ''));
        setIsModified(false);
        setShowSaveDialog(false);
        alert('File saved successfully!');
      } else {
        alert('Failed to save file');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Error saving file');
    }
  };

  const handleSaveAs = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpen = (e) => {
    if (isModified && !confirm('You have unsaved changes. Continue?')) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target.result);
        setFileName(file.name.replace('.txt', ''));
        setIsModified(false);
      };
      reader.readAsText(file);
    }
  };

  const handleFind = () => {
    if (!findText) return;
    const textarea = textareaRef.current;
    const text = textarea.value;
    const index = text.toLowerCase().indexOf(findText.toLowerCase());
    if (index !== -1) {
      textarea.focus();
      textarea.setSelectionRange(index, index + findText.length);
    } else {
      alert('Text not found');
    }
  };

  const handleReplace = () => {
    if (!findText) return;
    const newContent = content.replace(new RegExp(findText, 'gi'), replaceText);
    setContent(newContent);
    setIsModified(true);
  };

  const handleCut = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    navigator.clipboard.writeText(selectedText);
    setContent(content.substring(0, start) + content.substring(end));
    setIsModified(true);
  };

  const handleCopy = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    navigator.clipboard.writeText(selectedText);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + text + content.substring(end);
      setContent(newContent);
      setIsModified(true);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  return (
    <div className="notepad">
      {/* Menu Bar */}
      <div className="notepad-menu">
        <div className="menu-item">
          <span>File</span>
          <div className="dropdown">
            <div onClick={handleNew}>New			Ctrl+N</div>
            <div onClick={() => document.getElementById('file-input').click()}>Open...		Ctrl+O</div>
            <div onClick={handleSave}>Save			Ctrl+S</div>
            <div onClick={handleSaveAs}>Save As...</div>
            <hr />
            <div>Exit</div>
          </div>
        </div>
        <div className="menu-item">
          <span>Edit</span>
          <div className="dropdown">
            <div onClick={handleCut}>Cut			Ctrl+X</div>
            <div onClick={handleCopy}>Copy			Ctrl+C</div>
            <div onClick={handlePaste}>Paste			Ctrl+V</div>
            <hr />
            <div onClick={() => setShowFind(true)}>Find...			Ctrl+F</div>
            <div onClick={() => setShowReplace(true)}>Replace...		Ctrl+H</div>
            <hr />
            <div onClick={() => textareaRef.current?.select()}>Select All		Ctrl+A</div>
          </div>
        </div>
        <div className="menu-item">
          <span>View</span>
          <div className="dropdown">
            <div>Status Bar</div>
          </div>
        </div>
        <div className="menu-item">
          <span>Help</span>
          <div className="dropdown">
            <div onClick={() => alert('Notepad\nWindows XP Style Text Editor\nBuilt with React')}>About Notepad</div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="find-dialog">
          <div className="find-content">
            <div className="find-row">
              <label>File name:</label>
              <input 
                type="text" 
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') saveFile(fileName);
                  if (e.key === 'Escape') setShowSaveDialog(false);
                }}
                autoFocus
              />
              <button onClick={() => saveFile(fileName)}>Save</button>
            </div>
            <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Find/Replace Dialog */}
      {(showFind || showReplace) && (
        <div className="find-dialog">
          <div className="find-content">
            <div className="find-row">
              <label>Find:</label>
              <input 
                type="text" 
                value={findText} 
                onChange={(e) => setFindText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFind()}
              />
              <button onClick={handleFind}>Find Next</button>
            </div>
            {showReplace && (
              <div className="find-row">
                <label>Replace:</label>
                <input 
                  type="text" 
                  value={replaceText} 
                  onChange={(e) => setReplaceText(e.target.value)}
                />
                <button onClick={handleReplace}>Replace All</button>
              </div>
            )}
            <button onClick={() => { setShowFind(false); setShowReplace(false); }}>Close</button>
          </div>
        </div>
      )}

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        className="notepad-textarea"
        value={content}
        onChange={handleTextChange}
        placeholder="Type your text here..."
        spellCheck={false}
        onKeyDown={(e) => {
          if (e.ctrlKey) {
            switch(e.key) {
              case 'n': e.preventDefault(); handleNew(); break;
              case 's': e.preventDefault(); handleSave(); break;
              case 'o': e.preventDefault(); document.getElementById('file-input').click(); break;
              case 'f': e.preventDefault(); setShowFind(true); break;
              case 'h': e.preventDefault(); setShowReplace(true); break;
            }
          }
        }}
      />

      {/* Status Bar */}
      <div className="notepad-status">
        <span>Ln {content.split('\n').length}, Col {content.length - content.lastIndexOf('\n')}</span>
        <span>{content.length} characters</span>
      </div>

      {/* Hidden file input */}
      <input
        id="file-input"
        type="file"
        accept=".txt"
        onChange={handleOpen}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default Notepad;