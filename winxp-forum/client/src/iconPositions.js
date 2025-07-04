// Debounced position saving to minimize database calls
let saveTimeout = null;
const SAVE_DELAY = 2000; // 2 seconds after last drag

export const saveIconPositions = (positions, userId) => {
  if (!userId) return;
  
  // Save to localStorage immediately for instant feedback
  localStorage.setItem(`iconPositions_${userId}`, JSON.stringify(positions));
  
  // Debounce database save
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5001/api/user/icon-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ positions })
      });
    } catch (error) {
      console.error('Failed to save icon positions:', error);
    }
  }, SAVE_DELAY);
};

export const loadIconPositions = async (userId) => {
  if (!userId) return getDefaultPositions();
  
  // Try localStorage first for instant load
  const cached = localStorage.getItem(`iconPositions_${userId}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error('Invalid cached positions');
    }
  }
  
  // Only fetch from server if no cache exists
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5001/api/user/icon-positions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(`iconPositions_${userId}`, JSON.stringify(data.positions));
      return data.positions;
    }
  } catch (error) {
    console.error('Failed to load icon positions:', error);
  }
  
  return getDefaultPositions();
};

const getDefaultPositions = () => ({
  posts: { x: 0, y: 0 },
  create: { x: 0, y: 1 },
  admin: { x: 0, y: 2 },
  login: { x: 1, y: 0 },
  settings: { x: 1, y: 1 },
  // Add new icons here with default positions
  // newIcon: { x: 2, y: 0 }
});