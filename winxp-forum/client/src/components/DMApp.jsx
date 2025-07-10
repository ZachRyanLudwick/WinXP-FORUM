import React, { useState, useEffect, useRef } from 'react';
import LoginRequired from './LoginRequired';
import { getRankInfo } from '../utils/rankUtils.jsx';
import { apiCall } from '../utils/api.js';

const DMApp = ({ onOpenChat, user, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await apiCall('/api/messages/conversations');
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else {
        console.error('Failed to fetch conversations:', response.status);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginRequired = (
    <LoginRequired 
      user={user}
      onClose={onClose}
      appName="Messages"
      appIcon="💬"
      description="Please create an account or login to send and receive direct messages"
    />
  );
  
  if (!user) return loginRequired;
  
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading conversations...</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #ccc', background: '#f5f5f5' }}>
        <h3 style={{ fontSize: '14px', margin: 0 }}>💬 Direct Messages</h3>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '11px' }}>
            No conversations yet. Start chatting with other users!
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv._id}
              onClick={() => onOpenChat(conv.otherUser._id, conv.otherUser.username)}
              style={{
                padding: '12px',
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: conv.unreadCount > 0 ? '#f0f8ff' : 'white'
              }}
            >
              <div 
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#007bff', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                  border: `2px solid ${getRankInfo(conv.otherUser?.rank || 'Newbie').color}`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenProfile) {
                    onOpenProfile(conv.otherUser._id, conv.otherUser.username);
                  }
                }}
              >
                {conv.otherUser.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                  {conv.otherUser.username}
                  {conv.unreadCount > 0 && (
                    <span style={{
                      background: '#ff4757', color: 'white', borderRadius: '50%',
                      padding: '2px 6px', fontSize: '8px', marginLeft: '8px'
                    }}>
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                  {conv.lastMessage?.content?.substring(0, 50)}...
                </div>
                <div style={{ fontSize: '9px', color: '#999', marginTop: '2px' }}>
                  {new Date(conv.lastMessage?.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DMApp;