export const playerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '16px',
  color: '#2e7d32',
  fontFamily: "'Press Start 2P', cursive",
  textShadow: '2px 2px 0px rgba(0,0,0,0.5)'
};

export const scoreContainer = (isAnimating: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '16px',
  color: '#2e7d32',
  fontFamily: "'Press Start 2P', cursive",
  textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
  transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
  transition: 'transform 0.3s ease'
});

export const scoreLabel = () => ({
  color: '#2e7d32',
  display: 'inline-block'
});

export const scoreDigit = () => ({
  display: 'inline-block',
  color: '#2e7d32'
});

export const digitsContainer = {
  display: 'flex',
  gap: '2px'
};

export const usernameInput: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.7)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '4px',
  color: '#2e7d32',
  padding: '4px 8px',
  fontFamily: "'Press Start 2P', cursive",
  fontSize: '16px',
  width: '150px',
  outline: 'none'
}; 