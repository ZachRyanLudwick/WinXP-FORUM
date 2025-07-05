import React, { useState, useRef, useEffect } from 'react';

const Window = ({ 
  children, 
  title, 
  icon, 
  onClose, 
  onMinimize,
  onUpdateState,
  onFocus,
  initialPosition = { x: 50, y: 50 }, 
  initialSize = { width: 400, height: 300 },
  zIndex = 1,
  isActive = false
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - size.height - 40, e.clientY - dragOffset.y)); // 40px for taskbar
        
        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);
        if (onUpdateState) {
          onUpdateState({ position: newPosition });
        }
      }
      if (isResizing) {
        const newWidth = Math.max(200, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(150, resizeStart.height + (e.clientY - resizeStart.y));
        const newSize = { width: newWidth, height: newHeight };
        setSize(newSize);
        if (onUpdateState) {
          onUpdateState({ size: newSize });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, position, size, onUpdateState]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.window-button')) return;
    
    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
    setIsResizing(true);
  };

  return (
    <div 
      ref={windowRef}
      className="window"
      onMouseDown={onFocus}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex
      }}
    >
      <div 
        className="window-header"
        onMouseDown={handleMouseDown}
      >
        <div className="window-title">
          {icon && <span>{icon}</span>}
          <span>{title}</span>
        </div>
        <div className="window-controls">
          <button 
            className="window-button"
            onClick={onMinimize}
          >
            _
          </button>
          <button 
            className="window-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>
      <div className="window-content">
        {children}
      </div>
      <div 
        className="resize-handle"
        onMouseDown={handleResizeStart}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '16px',
          height: '16px',
          cursor: 'nw-resize',
          background: 'linear-gradient(-45deg, transparent 30%, #666 30%, #666 40%, transparent 40%, transparent 60%, #666 60%, #666 70%, transparent 70%)',
          zIndex: 10
        }}
      />
    </div>
  );
};

export default Window;