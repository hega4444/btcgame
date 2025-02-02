import React from 'react';
import { GameStats } from '../styles';
import {
  playerStyle,
  scoreContainer,
  scoreLabel,
  scoreDigit,
  digitsContainer
} from './styles/GameScore.styles';

interface GameScoreProps {
  username: string;
  scoreDigits: Array<{
    value: string;
    key: number;
    isAnimating: boolean;
  }>;
  gameStatsRef: React.RefObject<HTMLDivElement>;
}

export const GameScore: React.FC<GameScoreProps> = ({
  username,
  scoreDigits,
  gameStatsRef
}) => {
  return (
    <GameStats ref={gameStatsRef}>
      <div style={playerStyle}>
        <span>Player: </span>
        {username}
      </div>
      <div style={scoreContainer}>
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