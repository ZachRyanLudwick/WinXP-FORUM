const API_URL = 'https://api.xploithub.com';
// const API_URL = 'http://localhost:5001';

// Debug logging
console.log('API_URL from env:', import.meta.env.VITE_API_URL);
console.log('Final API_URL:', API_URL);

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  console.log('Making API call to:', url);
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