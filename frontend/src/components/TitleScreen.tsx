import React from 'react';
import { 
  Title, 
  TitleLine, 
  Letter, 
  PlayButton, 
  CoinContainer, 
  TopCoinContainer, 
  CoinSprite, 
  TopCoinSprite 
} from '../styles';
import { mainContentContainer } from './styles/App.styles';

interface TitleScreenProps {
  gameStarted: boolean;
  showPlayButton: boolean;
  handlePlay: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  gameStarted,
  showPlayButton,
  handlePlay
}) => {
  const titleLine1 = "Bitcoin";
  const titleLine2 = "Game";

  return (
    <div style={mainContentContainer(gameStarted)}>
      <TopCoinContainer style={{ margin: 0 }}>
        <TopCoinSprite />
      </TopCoinContainer>
      
      <Title>
        <TitleLine>
          {titleLine1.split('').map((letter, index) => (
            <Letter 
              key={index} 
              delay={index * 0.1}
            >
              {letter}
            </Letter>
          ))}
        </TitleLine>
        <TitleLine>
          {titleLine2.split('').map((letter, index) => (
            <Letter 
              key={index} 
              delay={(titleLine1.length + index) * 0.1}
            >
              {letter}
            </Letter>
          ))}
        </TitleLine>
      </Title>
      
      <CoinContainer style={{ margin: 0 }}>
        <CoinSprite />
      </CoinContainer>
      
      {showPlayButton && (
        <PlayButton onClick={handlePlay}>
          Play
        </PlayButton>
      )}
    </div>
  );
}; 