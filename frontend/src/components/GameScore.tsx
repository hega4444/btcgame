import * as React from 'react';
import { GameStats } from '../styles';
import {
  playerStyle,
  scoreContainer,
  scoreLabel,
  scoreDigit,
  digitsContainer,
  usernameInput
} from './styles/GameScore.styles';
import { api } from '../services/api';

/**
 * Game Score Component
 * 
 * Displays and manages the player's score and username.
 * Handles username editing and score animations.
 * 
 * Features:
 * - Score display with animations
 * - Username editing interface
 * - Real-time score updates
 * - Responsive design
 * 
 * Props:
 * - username: Current player name
 * - clientId: User identifier
 * - scoreDigits: Array of score digits with animation states
 * - gameStatsRef: Reference to stats container
 * - onUsernameChange: Username update callback
 * - isMobile: Responsive layout flag
 */

interface GameScoreProps {
  username: string;
  clientId: string;
  scoreDigits: Array<{
    value: string;
    key: number;
    isAnimating: boolean;
  }>;
  gameStatsRef: React.RefObject<HTMLDivElement>;
  onUsernameChange: (newUsername: string) => void;
  isMobile: boolean;
}

export const GameScore: React.FC<GameScoreProps> = ({
  username,
  clientId,
  scoreDigits,
  gameStatsRef,
  onUsernameChange,
  isMobile
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedUsername, setEditedUsername] = React.useState(username);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditedUsername(username);
  }, [username]);

  const handleUsernameClick = () => {
    setIsEditing(true);
    setEditedUsername(username);
  };

  const handleUsernameSubmit = async () => {
    console.log('Submitting username:', { 
      editedUsername, 
      currentUsername: username, 
      clientId 
    });

    if (editedUsername.trim() && editedUsername !== username) {
      try {
        // Update frontend and localStorage immediately
        onUsernameChange(editedUsername);
        localStorage.setItem('btcGameUsername', editedUsername);
        
        // Make the API call
        console.log('Calling API to update username...');
        const result = await api.registerUser(editedUsername, clientId);
        console.log('✅ API Response:', result);
        
        setIsEditing(false);
      } catch (error) {
        console.error('❌ Failed to update username:', error);
        setIsEditing(false);
      }
    } else {
      console.log('No changes to submit');
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('Key pressed:', e.key);
    if (e.key === 'Enter') {
      console.log('Enter pressed, submitting...');
      handleUsernameSubmit();
    } else if (e.key === 'Escape') {
      console.log('Escape pressed, canceling...');
      setIsEditing(false);
      setEditedUsername(username);
    }
  };

  return (
    <GameStats 
      ref={gameStatsRef} 
      style={{
        position: 'absolute',
        top: '5px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '3px',
        fontSize: isMobile ? '7px' : '16px'
      }}
    >
      {/* Player section */}
      <div style={{
        position: 'absolute',
        left: '10px',
        marginLeft: '-10px',
        fontSize: isMobile ? '1px' : '16px',
        color: '#2e7d32'
      }}>
        {/* Player label */}
        <div style={{ 
          marginBottom: isMobile ? '4px' : '0',
          color: '#2e7d32',
          fontSize: isMobile ? '5px' : '16px'
        }}>
          Player:
        </div>
        {/* Username section */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editedUsername}
            onChange={(e) => setEditedUsername(e.target.value)}
            onBlur={handleUsernameSubmit}
            onKeyDown={handleKeyDown}
            style={{
              ...usernameInput,
              fontSize: isMobile ? '7px' : '16px',
              marginLeft: isMobile ? '5px' : '0',
              display: 'block'
            }}
            maxLength={20}
          />
        ) : (
          <div 
            onClick={handleUsernameClick}
            style={{ 
              cursor: 'pointer', 
              textDecoration: 'underline',
              marginLeft: isMobile ? '5px' : '0',
              display: 'block',
              marginTop: isMobile ? '2px' : '0',
              color: '#2e7d32',
              fontSize: isMobile ? '7px' : '16px'
            }}
          >
            {username}
          </div>
        )}
      </div>

      {/* Score section */}
      <div style={{
        ...scoreContainer(scoreDigits[0]?.isAnimating),
        fontSize: isMobile ? '7px' : '16px'
      }}>
        <span style={scoreLabel()}>Score:</span>
        <div style={digitsContainer}>
          {scoreDigits.map((digit, index) => (
            <span
              key={digit.key}
              style={{
                ...scoreDigit(),
                fontSize: isMobile ? '7px' : '16px'
              }}
            >
              {digit.value}
            </span>
          ))}
        </div>
      </div>
    </GameStats>
  );
}; 