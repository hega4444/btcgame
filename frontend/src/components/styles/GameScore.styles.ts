export const playerStyle = {
  color: '#2e7d32'
};

export const scoreContainer = {
  color: '#2e7d32',
  display: 'flex',
  gap: '4px',
  alignItems: 'center'
};

export const scoreLabel = (isAnimating: boolean) => ({
  display: 'inline-block',
  animation: isAnimating 
    ? `scorePopup 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)` 
    : 'none'
});

export const scoreDigit = (isAnimating: boolean, index: number) => ({
  display: 'inline-block',
  animation: isAnimating 
    ? `scorePopup 0.5s ${index * 0.1}s cubic-bezier(0.175, 0.885, 0.32, 1.275)` 
    : 'none'
});

export const digitsContainer = {
  display: 'flex'
}; 