import React, { useState, useEffect, useRef } from 'react';
import { getRankInfo } from '../utils/rankUtils.jsx';

const DMChat = ({ userId, username, onOpenProfile }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [dmAllowed, setDmAllowed] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    checkDMSettings();
    const interval = setInterval(() => {
      fetchMessages();
      checkDMSettings();
    }, 2000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`http://localhost:5001/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // Mark messages as read
        await fetch(`http://localhost:5001/api/messages/${userId}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://localhost:5001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: userId,
          content: newMessage
        })
      });
      
      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const checkDMSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`http://localhost:5001/api/user/${userId}/dm-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const settings = await response.json();
        
        // If general DMs are allowed, always allow
        if (settings.allowDMs) {
          setDmAllowed(true);
          return;
        }
        
        // If general DMs are disabled, check friend setting
        if (settings.allowDMsFromFriends) {
          // Check if we're friends
          const friendsResponse = await fetch('http://localhost:5001/api/friends', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (friendsResponse.ok) {
            const friends = await friendsResponse.json();
            const isFriend = friends.some(friend => friend._id === userId);
            setDmAllowed(isFriend);
          } else {
            setDmAllowed(false);
          }
        } else {
          setDmAllowed(false);
        }
      }
    } catch (error) {
      console.error('Error checking DM settings:', error);
    }
  };

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading chat...</div>;
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      opacity: dmAllowed ? 1 : 0.5,
      pointerEvents: dmAllowed ? 'auto' : 'none'
    }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #ccc', background: '#f5f5f5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: '#007bff', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
              border: `2px solid ${getRankInfo('Newbie').color}` // Default since we don't have user rank here
            }}
            onClick={() => onOpenProfile && onOpenProfile(userId, username)}
          >
            {username.charAt(0).toUpperCase()}
          </div>
          <h3 style={{ fontSize: '14px', margin: 0 }}>Chat with {username}</h3>
        </div>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', fontSize: '11px', marginTop: '20px' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message._id}
              style={{
                display: 'flex',
                justifyContent: message.sender._id === currentUserId ? 'flex-end' : 'flex-start',
                marginBottom: '8px'
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  background: message.sender._id === currentUserId ? '#007bff' : '#f0f0f0',
                  color: message.sender._id === currentUserId ? 'white' : 'black',
                  fontSize: '11px'
                }}
              >
                <div>{message.content}</div>
                <div style={{
                  fontSize: '9px',
                  opacity: 0.7,
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ padding: '12px', borderTop: '1px solid #ccc', background: '#f8f9fa' }}>
        {!dmAllowed ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            fontSize: '11px',
            padding: '8px'
          }}>
            This user has disabled direct messages
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '11px'
              }}
            />
            <button
              className="button primary"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              style={{ fontSize: '10px' }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DMChat;