export const winLoseMessageContainer = {
  position: 'fixed' as const,
  bottom: '40px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'auto',
  height: '120px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none' as const,
  zIndex: 1001,
  padding: '15px',
  border: '4px solid white',
  borderImage: 'linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.4) 20%, rgba(255, 255, 255, 0.4) 80%, transparent 100%) 1',
  background: 'rgba(0, 0, 0, 0.2)',
  minWidth: '300px'
};

export const messageContent = (lastWasWin: boolean) => ({
  color: lastWasWin ? '#f44336' : '#4CAF50',
  fontFamily: "'Press Start 2P', cursive",
  fontSize: '24px',
  textAlign: 'center' as const,
  textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
  animation: 'winMessagePopup 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  padding: '15px',
  background: 'rgba(0, 0, 0, 0.8)',
  borderRadius: '8px',
  border: `2px solid ${lastWasWin ? '#f44336' : '#4CAF50'}`,
  whiteSpace: 'nowrap' as const
}); 