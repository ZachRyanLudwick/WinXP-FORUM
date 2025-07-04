import React, { useState } from 'react';

const UserSearch = ({ onOpenProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/profile/search/${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const users = await response.json();
        setSearchResults(users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-search">
      {/* Search Header */}
      <div className="search-header">
        <input
          type="text"
          placeholder="Search for users..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchUsers(e.target.value);
          }}
          className="search-input"
          autoFocus
        />
        {loading && <div className="search-loading">Searching...</div>}
      </div>

      {/* Search Results */}
      <div className="search-content">
        {searchQuery && searchResults.length === 0 && !loading && (
          <div className="no-results">
            <div>🔍</div>
            <div>No users found for "{searchQuery}"</div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="user-results">
            {searchResults.map(user => (
              <div 
                key={user._id}
                className="user-result-item"
                onClick={() => onOpenProfile(user._id, user.username)}
              >
                <div className="user-avatar">👤</div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                  <div className="user-details">
                    <span className="user-role">{user.isAdmin ? 'Administrator' : 'Member'}</span>
                    <span className="user-joined">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="user-action">
                  View Profile →
                </div>
              </div>
            ))}
          </div>
        )}

        {!searchQuery && (
          <div className="search-help">
            <div>👥</div>
            <div>Start typing to search for users</div>
            <div>Find other members by their username</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;