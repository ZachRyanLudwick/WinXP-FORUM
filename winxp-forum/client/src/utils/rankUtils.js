// Rank system utilities
export const getRankInfo = (rank) => {
  const ranks = {
    'Newbie': {
      color: '#9e9e9e',
      label: 'Newbie',
      minKarma: 0
    },
    'Member': {
      color: '#4caf50',
      label: 'Member',
      minKarma: 50
    },
    'Expert': {
      color: '#2196f3',
      label: 'Expert',
      minKarma: 200
    },
    'Elite': {
      color: '#9c27b0',
      label: 'Elite',
      minKarma: 500
    },
    'Legend': {
      color: '#ff9800',
      label: 'Legend',
      minKarma: 1000
    }
  };
  
  return ranks[rank] || ranks['Newbie'];
};

export const calculateRank = (totalKarma) => {
  if (totalKarma >= 1000) return 'Legend';
  if (totalKarma >= 500) return 'Elite';
  if (totalKarma >= 200) return 'Expert';
  if (totalKarma >= 50) return 'Member';
  return 'Newbie';
};

export const RankBadge = ({ rank, size = 'small' }) => {
  const rankInfo = getRankInfo(rank);
  const fontSize = size === 'large' ? '10px' : '8px';
  
  return (
    <span style={{
      background: rankInfo.color,
      color: 'white',
      padding: '2px 6px',
      borderRadius: '10px',
      fontSize,
      fontWeight: 'bold',
      textTransform: 'uppercase'
    }}>
      {rankInfo.label}
    </span>
  );
};