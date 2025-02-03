import * as React from 'react';

interface WinLoseMessageProps {
  showWinMessage: boolean;
  timer: number | null;
  lastWasWin: boolean;
  winSoundRef: React.RefObject<HTMLAudioElement | null>;
  loseSoundRef: React.RefObject<HTMLAudioElement | null>;
}

export const WinLoseMessage: React.FC<WinLoseMessageProps> = ({
  showWinMessage,
  timer,
  lastWasWin,
}) => {
  if (!showWinMessage) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '40px', // Same as bet box
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      padding: '20px 40px',
      background: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '10px',
      border: '2px solid',
      borderColor: lastWasWin ? '#4CAF50' : '#f44336',
      boxShadow: `0 0 20px ${lastWasWin ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'}`,
      animation: 'winMessagePopup 0.5s ease-out',
      width: 'auto',
      maxWidth: '90%', // Prevent message from touching screen edges
      margin: '0 10px', // Add horizontal margin
    }}>
      <div style={{
        color: lastWasWin ? '#4CAF50' : '#f44336',
        fontFamily: "'Press Start 2P', cursive",
        fontSize: window.innerWidth < 768 ? '16px' : '24px', // Smaller font on mobile
        textAlign: 'center',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        whiteSpace: 'nowrap',
        padding: window.innerWidth < 768 ? '0 10px' : '0', // Add padding on mobile
      }}>
        {lastWasWin ? 'YOU WIN!' : 'KEEP TRYING!'}
      </div>
    </div>
  );
}; 