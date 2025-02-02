export const mainContentContainer = (gameStarted: boolean) => ({
  transform: gameStarted ? 'translateY(-150vh)' : 'translateY(0)',
  transition: 'transform 0.5s ease',
  position: 'relative' as const,
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  gap: 'clamp(2rem, 5vh, 4rem)'
});

export const dialogStyles = {
  position: 'fixed' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'rgba(20, 30, 45, 0.95)',
  padding: '20px',
  zIndex: 1000,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'white',
  borderRadius: '20px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  minWidth: '300px',
  width: '90vw',
  maxWidth: '400px',
  fontFamily: "'Press Start 2P', cursive"
};

export const dialogTitle = {
  color: 'white',
  marginTop: '0',
  fontSize: '1.4em',
  textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
};

export const dialogText = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '0.9em',
  lineHeight: '1.5'
};

export const inputContainer = {
  display: 'flex',
  justifyContent: 'center',
  width: '100%'
};

export const inputStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  padding: '8px 12px',
  fontSize: '0.9em',
  outline: 'none',
  width: '80%',
  maxWidth: '300px',
  boxSizing: 'border-box' as const,
  marginBottom: '10px',
  textAlign: 'center' as const,
  fontFamily: "'Press Start 2P', cursive",
};

export const dialogFooterText = {
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '0.8em'
};

export const acceptButton = (disabled: boolean) => ({
  backgroundColor: '#FFEB3B',
  color: '#000',
  border: 'none',
  padding: '8px 16px',
  fontSize: '0.9em',
  cursor: disabled ? 'not-allowed' : 'pointer',
  borderRadius: '4px',
  fontFamily: "'Press Start 2P', cursive",
  textTransform: 'uppercase' as const,
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  transition: 'all 0.2s ease',
  opacity: disabled ? 0.5 : 1
});

export const settingsContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  padding: '20px 0'
};

export const currencyContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  alignItems: 'center'
};

export const currencyLabel: React.CSSProperties = {
  color: '#ffd700',
  fontSize: '0.9em',
  marginBottom: '5px',
  fontFamily: "'Press Start 2P', cursive"
};

export const currencyButtonsContainer: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'center'
};

export const currencyButton = (isSelected: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  background: isSelected ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)',
  border: `2px solid ${isSelected ? '#ffd700' : 'rgba(255, 215, 0, 0.3)'}`,
  borderRadius: '4px',
  color: isSelected ? '#ffd700' : '#fff',
  cursor: 'pointer',
  fontFamily: "'Press Start 2P', cursive",
  fontSize: '0.8em',
  transition: 'all 0.2s ease'
});

export const resetScoreContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  alignItems: 'center',
  marginTop: '20px'
};

export const resetScoreButton: React.CSSProperties = {
  padding: '10px 20px',
  background: 'rgba(220, 53, 69, 0.2)',
  border: '2px solid #dc3545',
  borderRadius: '4px',
  color: '#dc3545',
  cursor: 'pointer',
  fontFamily: "'Press Start 2P', cursive",
  fontSize: '0.8em',
  transition: 'all 0.2s ease'
}; 