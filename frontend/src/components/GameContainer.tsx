import React, { useState, useRef, useMemo } from 'react';
import { GameContainer as StyledGameContainer, Box } from '../styles';
import { GameBoard } from './GameBoard';
import { GameScore } from './GameScore';
import { TopButton } from '../styles';
import { SettingsButton } from './SettingsButton';
import { WinLoseMessage } from './WinLoseMessage';
import { CoinAnimationContainer, CoinSprite } from '../styles';
import { BubbleContainer, Bubble } from '../styles';
import { TitleScreen } from './TitleScreen';
import { LeaderboardDialog, CloseButton } from '../styles';
import {
  settingsContainer,
  currencyContainer,
  currencyLabel,
  currencyButtonsContainer,
  currencyButton,
  resetScoreContainer,
  resetScoreButton
} from './styles/App.styles';
import { BettingInterface } from './BettingInterface';

type ScoreDigit = {
  value: string;
  key: number;
  isAnimating: boolean;
};

type CoinAnimation = {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

type BubbleType = {
  key: number;
  size: number;
  duration: number;
  delay: number;
  left: number;
};

interface GameContainerProps {
  prices: Array<{timestamp: string; price: number}>;
  gameStarted: boolean;
  currency: string;
  username: string;
  isMobile: boolean;
  showPlayButton: boolean;
  handlePlay: () => void;
  isMusicPlaying: boolean;
  setIsMusicPlaying: (playing: boolean) => void;
  winSoundRef: React.RefObject<HTMLAudioElement | null>;
  loseSoundRef: React.RefObject<HTMLAudioElement | null>;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  setCurrency: (currency: string) => void;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  prices,
  gameStarted,
  currency,
  username,
  isMobile,
  showPlayButton,
  handlePlay,
  isMusicPlaying,
  setIsMusicPlaying,
  winSoundRef,
  loseSoundRef,
  showSettings,
  setShowSettings,
  setCurrency,
}) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isBetting, setIsBetting] = useState(false);
  const [currentBet, setCurrentBet] = useState<'up' | 'down' | null>(null);
  const [betPrice, setBetPrice] = useState<number | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [showWinMessage, setShowWinMessage] = useState(false);
  const [isBetBoxHovered, setIsBetBoxHovered] = useState(false);
  const [lastWasWin, setLastWasWin] = useState(true);
  const [scoreDigits, setScoreDigits] = useState<ScoreDigit[]>([{ value: '0', key: 0, isAnimating: false }]);
  const [winningCoins, setWinningCoins] = useState<CoinAnimation[]>([]);
  const gameStatsRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);

  const handleResetScore = () => {
    setScore(0);
  };

  const bubbles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      size: Math.random() * 50 + 20,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * -20,
      left: Math.random() * 100,
      key: i
    }));
  }, []);

  const handleBetComplete = (result: BetResult) => {
    console.log('Handling bet completion:', result);
    
    setIsBetting(false);
    setCurrentBet(null);
    setShowWinMessage(true);
    setLastWasWin(!result.won);
    
    if (result.won) {
      const newScore = score + result.profit;
      setScore(newScore);
      
      if (winSoundRef.current) {
        winSoundRef.current.currentTime = 0;
        winSoundRef.current.play().catch(console.error);
      }
      
      if (gameStatsRef.current) {
        const rect = gameStatsRef.current.getBoundingClientRect();
        const newCoin: CoinAnimation = {
          id: Date.now() + Math.random(),
          startX: window.innerWidth / 2,
          startY: window.innerHeight * 0.8,
          endX: rect.left + rect.width / 2,
          endY: rect.top + rect.height / 2
        };

        setWinningCoins(prev => [...prev, newCoin]);

        setTimeout(() => {
          setWinningCoins(prev => prev.filter(coin => coin.id !== newCoin.id));
        }, 1000);
      }

      setTimeout(() => {
        updateScoreWithAnimation(newScore);
      }, 500);
    } else {
      const newScore = Math.max(0, score - Math.abs(result.profit));
      setScore(newScore);
      
      if (loseSoundRef.current) {
        loseSoundRef.current.currentTime = 0;
        loseSoundRef.current.play().catch(console.error);
      }
      
      updateScoreWithAnimation(newScore);
    }

    setTimeout(() => {
      setShowWinMessage(false);
      setTimer(null);
      setBetPrice(null);
    }, 3000);
  };

  const updateScoreWithAnimation = (newScore: number) => {
    const digits = newScore.toString().split('');
    const now = Date.now();
    
    const newScoreDigits = digits.map((digit, index) => ({
      value: digit,
      key: now + index,
      isAnimating: true
    }));
    
    setScoreDigits(newScoreDigits);

    setTimeout(() => {
      setScoreDigits(digits.map((digit, index) => ({
        value: digit,
        key: now + index,
        isAnimating: false
      })));
    }, 1000);
  };

  return (
    <StyledGameContainer>
      <Box>
        <GameBoard 
          prices={prices}
          gameStarted={gameStarted}
          currency={currency}
          isMobile={isMobile}
        />

        {gameStarted && (
          <>
            <GameScore 
              username={username}
              scoreDigits={scoreDigits}
              gameStatsRef={gameStatsRef}
            />

            <TopButton onClick={() => setShowLeaderboard(true)} style={{ color: '#2e7d32' }}>
              TOP 10 <br />PLAYERS
            </TopButton>

            <SettingsButton 
              isMobile={isMobile}
              onClick={() => setShowSettings(true)}
            />

            <BettingInterface 
              isBetting={isBetting}
              currentBet={currentBet}
              betPrice={betPrice}
              timer={timer}
              username={username}
              currency={currency}
              prices={prices}
              setIsBetting={setIsBetting}
              setCurrentBet={setCurrentBet}
              setBetPrice={setBetPrice}
              setTimer={setTimer}
              score={score}
              setScore={setScore}
              gameStatsRef={gameStatsRef}
              updateScoreWithAnimation={updateScoreWithAnimation}
              winSoundRef={winSoundRef}
              loseSoundRef={loseSoundRef}
              gameStarted={gameStarted}
            />

            <WinLoseMessage 
              showWinMessage={showWinMessage}
              timer={timer}
              lastWasWin={lastWasWin}
              winSoundRef={winSoundRef}
              loseSoundRef={loseSoundRef}
            />

            {winningCoins.map(coin => (
              <CoinAnimationContainer
                key={coin.id}
                $startX={coin.startX}
                $startY={coin.startY}
              >
                <CoinSprite />
              </CoinAnimationContainer>
            ))}
          </>
        )}

        <TitleScreen 
          gameStarted={gameStarted}
          showPlayButton={showPlayButton}
          handlePlay={handlePlay}
        />

        <BubbleContainer>
          {bubbles.map(bubble => (
            <Bubble
              key={bubble.key}
              size={bubble.size}
              duration={bubble.duration}
              delay={bubble.delay}
              left={bubble.left}
            />
          ))}
        </BubbleContainer>

        {showSettings && (
          <LeaderboardDialog>
            <CloseButton onClick={() => setShowSettings(false)}>×</CloseButton>
            <h2>SETTINGS</h2>
            <div style={settingsContainer}>
              <div style={currencyContainer}>
                <span style={currencyLabel}>CURRENCY</span>
                <div style={currencyButtonsContainer}>
                  {['USD', 'EUR', 'GBP'].map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setCurrency(curr)}
                      style={currencyButton(currency === curr)}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div style={resetScoreContainer}>
                <button
                  onClick={handleResetScore}
                  style={resetScoreButton}
                >
                  RESET SCORE
                </button>
              </div>
            </div>
          </LeaderboardDialog>
        )}
      </Box>
    </StyledGameContainer>
  );
}; 