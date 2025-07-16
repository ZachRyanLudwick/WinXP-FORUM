const API_URL = 'https://api.xploithub.com';
// const API_URL = 'http://localhost:5001';
// const API_URL = 'http://192.168.7.152:5001';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  return fetch(url, { ...defaultOptions, ...options });
};

export { API_URL };