import * as React from 'react';
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
import { api } from '../services/api';
import { WinningCoin } from './CoinSprite';

type ScoreDigit = {
  value: string;
  key: number;
  isAnimating: boolean;
};

interface GameContainerProps {
  prices: Array<{timestamp: string; price: number}>;
  gameStarted: boolean;
  currency: string;
  username: string;
  clientId: string;
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
  onLeaderboardClick: () => void;
  setUsername: (username: string) => void;
}

/**
 * Game Container Component
 * 
 * Main container component that orchestrates the game's core functionality.
 * Manages game state, betting interface, and score tracking.
 * 
 * Features:
 * - Price chart display
 * - Score management
 * - Betting interface integration
 * - Settings management
 * - Animation handling
 * - Responsive layout
 * 
 * Props:
 * - prices: Bitcoin price history
 * - gameStarted: Game state flag
 * - currency: Selected currency
 * - username: Player username
 * - clientId: User identifier
 * - Various UI state and callback props
 */
export const GameContainer: React.FC<GameContainerProps> = ({
  prices,
  gameStarted,
  currency,
  username,
  clientId,
  isMobile,
  showPlayButton,
  handlePlay,
  winSoundRef,
  loseSoundRef,
  showSettings,
  setShowSettings,
  setCurrency,
  onLeaderboardClick,
  setUsername,
  isMusicPlaying,
}) => {
  const [isBetting, setIsBetting] = React.useState(false);
  const [currentBet, setCurrentBet] = React.useState<'up' | 'down' | null>(null);
  const [betPrice, setBetPrice] = React.useState<number | null>(null);
  const [timer, setTimer] = React.useState<number | null>(null);
  const [scoreDigits, setScoreDigits] = React.useState<ScoreDigit[]>([{ value: '0', key: 0, isAnimating: false }]);
  const [winningCoins, setWinningCoins] = React.useState<Array<{
    id: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }>>([]);
  const gameStatsRef = React.useRef<HTMLDivElement>(null);
  const [score, setScore] = React.useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const updateScoreWithAnimation = React.useCallback((newScore: number) => {
    console.log('🎯 Updating score with animation:', newScore);
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
  }, []);

  React.useEffect(() => {
    const fetchUserScore = async () => {
      if (!gameStarted || !clientId) {
        console.log('⏳ Waiting for game to start or clientId', { gameStarted, clientId });
        return;
      }
      
      try {
        console.log('🎮 Game started, fetching score for:', clientId);
        const userStats = await api.getUserStats(clientId);
        console.log('📈 Fetched user stats:', userStats);

        if (userStats && typeof userStats.score === 'number') {
          console.log('✅ Setting score to:', userStats.score);
          setScore(userStats.score);
          updateScoreWithAnimation(userStats.score);
        } else {
          console.warn('❌ Invalid score in user stats:', userStats);
        }
      } catch (error) {
        console.error('💥 Failed to fetch user score:', error);
      }
    };

    fetchUserScore();
  }, [gameStarted, clientId, updateScoreWithAnimation]);

  const handleResetScore = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    // First remove local storage items
    localStorage.removeItem('btcGameAccepted');
    localStorage.removeItem('btcGameUsername');
    localStorage.removeItem('btcGameClientId');
    
    // Reset UI state
    setScore(0);
    setShowSettings(false);
    setShowConfirmDialog(false);

    // Attempt API call but don't block on it
    try {
      await api.forgetUser(clientId);
    } catch (error) {
      console.error('Failed to delete user data from API:', error);
      // No user-facing error message
    }

    // Reload page after everything
    window.location.reload();
  };

  const bubbles = React.useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      size: Math.random() * 50 + 20,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * -20,
      left: Math.random() * 100,
      key: i
    }));
  }, []);

  const showWinningCoin = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const newCoin = {
      id: Date.now(),
      startX: window.innerWidth / 2,
      startY: window.innerHeight * 0.8,
      endX: window.innerWidth / 2,
      endY: window.innerHeight * 0.2, // Make it go higher
    };
    
    setWinningCoins([newCoin]);
    
    timeoutRef.current = setTimeout(() => {
      setWinningCoins([]);
      timeoutRef.current = null;
    }, 2000);
  }, []);

  // Add cleanup
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleUsernameChange = (newUsername: string) => {
    setUsername(newUsername);
  };

  return (
    <StyledGameContainer>
      <Box>
        <GameBoard 
          prices={prices}
          gameStarted={gameStarted}
          currency={currency}
          isMobile={isMobile}
          betPrice={betPrice}
        />

        {gameStarted && (
          <>
            <GameScore 
              username={username}
              clientId={clientId}
              scoreDigits={scoreDigits}
              gameStatsRef={gameStatsRef}
              onUsernameChange={handleUsernameChange}
            />

            <TopButton 
              onClick={onLeaderboardClick} 
              style={{ 
                color: '#2e7d32',
                fontSize: isMobile ? '10px' : '14px',
                top: isMobile ? '35px' : '50px',
                right: '10px'
              }}
            >
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
              clientId={clientId}
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
              onWin={showWinningCoin}
              isMusicPlaying={isMusicPlaying}
            />

            <WinLoseMessage 
              showWinMessage={false}
              timer={timer}
              winSoundRef={winSoundRef}
              loseSoundRef={loseSoundRef}
              lastWasWin={true}
            />

            {winningCoins.map(coin => (
              <WinningCoin
                key={coin.id}
                startX={coin.startX}
                startY={coin.startY}
                endX={coin.endX}
                endY={coin.endY}
              />
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
                  DELETE MY DATA AND SCORE
                </button>
              </div>
            </div>
          </LeaderboardDialog>
        )}

        {showConfirmDialog && (
          <LeaderboardDialog>
            <CloseButton onClick={() => setShowConfirmDialog(false)}>×</CloseButton>
            <h2>WARNING!</h2>
            <div style={settingsContainer}>
              <p style={{
                color: '#dc3545',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                This will delete all your data and scores permanently!
              </p>
              <div style={{
                display: 'flex',
                gap: '20px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={handleConfirmDelete}
                  style={{
                    ...resetScoreButton,
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderColor: '#dc3545'
                  }}
                >
                  YES, DELETE
                </button>
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  style={{
                    ...resetScoreButton,
                    backgroundColor: 'rgba(108, 117, 125, 0.2)',
                    borderColor: '#6c757d'
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </LeaderboardDialog>
        )}
      </Box>
    </StyledGameContainer>
  );
}; 