import React, { useState, useRef, useEffect } from 'react';
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
}

export const GameScore: React.FC<GameScoreProps> = ({
  username,
  clientId,
  scoreDigits,
  gameStatsRef,
  onUsernameChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(username);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
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
    <GameStats ref={gameStatsRef}>
      <div style={playerStyle}>
        <span>Player: </span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editedUsername}
            onChange={(e) => setEditedUsername(e.target.value)}
            onBlur={handleUsernameSubmit}
            onKeyDown={handleKeyDown}
            style={usernameInput}
            maxLength={20}
          />
        ) : (
          <span 
            onClick={handleUsernameClick}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            {username}
          </span>
        )}
      </div>
      <div style={scoreContainer(scoreDigits[0]?.isAnimating)}>
        <span style={scoreLabel(scoreDigits[0]?.isAnimating)}>
          Score:
        </span>
        <div style={digitsContainer}>
          {scoreDigits.map((digit, index) => (
            <span
              key={digit.key}
              style={scoreDigit(digit.isAnimating, index)}
            >
              {digit.value}
            </span>
          ))}
        </div>
      </div>
    </GameStats>
  );
}; 