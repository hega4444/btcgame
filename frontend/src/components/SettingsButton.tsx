import * as React from 'react';

interface SettingsButtonProps {
  isMobile: boolean;
  onClick: () => void;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ isMobile, onClick }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '70px',
        right: '20px',
        zIndex: 1000,
        cursor: 'pointer',
        padding: '10px',
        background: 'rgba(0, 0, 0, 0.15)',
        borderRadius: isMobile ? '50%' : '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '16px',
        color: '#fff',
        transition: 'all 0.2s ease',
      }} 
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <span>⚙️</span>
      {!isMobile && (
        <span style={{ 
          fontSize: '12px',
          opacity: 0.7
        }}>
          SETTINGS
        </span>
      )}
    </div>
  );
}; 