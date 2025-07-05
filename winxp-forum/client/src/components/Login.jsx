import React, { useState } from 'react';
import XPPopup from './XPPopup';

const Login = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);

  const validateForm = () => {
    if (!isLogin) {
      // Registration validation
      if (username.length < 4) {
        setPopup({
          title: 'Validation Error',
          message: 'Username must be at least 4 characters long',
          type: 'error',
          onClose: () => setPopup(null)
        });
        return false;
      }
      
      if (password.length < 8) {
        setPopup({
          title: 'Validation Error',
          message: 'Password must be at least 8 characters long',
          type: 'error',
          onClose: () => setPopup(null)
        });
        return false;
      }
      
      const hasUpperCase = /[A-Z]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      if (!hasUpperCase) {
        setPopup({
          title: 'Validation Error',
          message: 'Password must contain at least one uppercase letter',
          type: 'error',
          onClose: () => setPopup(null)
        });
        return false;
      }
      
      if (!hasSpecialChar) {
        setPopup({
          title: 'Validation Error',
          message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)',
          type: 'error',
          onClose: () => setPopup(null)
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? 'http://localhost:5001/api/auth/login' : 'http://localhost:5001/api/auth/register';
      const body = isLogin 
        ? { email: email.toLowerCase(), password }
        : { username: username.toLowerCase(), email: email.toLowerCase(), password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `${isLogin ? 'Login' : 'Registration'} failed`);
      }

      localStorage.setItem('token', data.token);
      setPopup({
        title: isLogin ? 'Login Successful' : 'Registration Successful',
        message: `Welcome ${data.user.username}!`,
        type: 'success',
        onClose: () => {
          setPopup(null);
          onLogin(data.user);
          onClose();
        }
      });
    } catch (err) {
      setPopup({
        title: isLogin ? 'Login Failed' : 'Registration Failed',
        message: err.message,
        type: 'error',
        onClose: () => setPopup(null)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <button
          type="button"
          className={`tab-button ${isLogin ? 'active' : ''}`}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button
          type="button"
          className={`tab-button ${!isLogin ? 'active' : ''}`}
          onClick={() => setIsLogin(false)}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={!isLogin}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>



        <button 
          type="submit" 
          className="button primary"
          disabled={loading}
        >
          {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>
      
      {popup && (
        <XPPopup
          title={popup.title}
          message={popup.message}
          type={popup.type}
          onClose={popup.onClose}
        />
      )}
    </div>
  );
};

export default Login;