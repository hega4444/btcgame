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
  // Remove all audio initialization logic
  if (!showWinMessage || timer !== 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '40px', // Same as bet box
      left: '50%',
      transform: 'translateX(-50%)', // Only transform X since we want it at the bottom
      zIndex: 1000,
      padding: '20px 40px',
      background: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '10px',
      border: '2px solid',
      borderColor: lastWasWin ? '#4CAF50' : '#f44336',
      boxShadow: `0 0 20px ${lastWasWin ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'}`,
      animation: 'winMessagePopup 0.5s ease-out'
    }}>
      <div style={{
        color: lastWasWin ? '#4CAF50' : '#f44336',
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '24px',
        textAlign: 'center',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        whiteSpace: 'nowrap'
      }}>
        {lastWasWin ? 'YOU WIN!' : 'KEEP TRYING!'}
      </div>
    </div>
  );
}; 