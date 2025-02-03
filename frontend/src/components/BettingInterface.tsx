import * as React from 'react';
import { api } from '../services/api';
import { WinLoseMessage } from './WinLoseMessage';

const BET_TIMER = (() => {
  const customTimerSeconds = import.meta.env.VITE_BET_TIMER_SECONDS;
  console.log('VITE_BET_TIMER_SECONDS value:', customTimerSeconds);
  // Convert to number and validate, multiply by 1000 to convert to milliseconds
  const timerValue = parseInt(customTimerSeconds as string);
  return !isNaN(timerValue) ? timerValue * 1000 : 60000; // Default to 60 seconds if not set
})();

// Add debug logging
console.log('Using bet timer (ms):', BET_TIMER);

// Add the helper functions at the top of the file
const formatTimer = (seconds: number | null) => {
  if (seconds === null) return '0:00';
  return `0:${seconds.toString().padStart(2, '0')}`;
};

const getTimerColor = (seconds: number) => {
  if (seconds <= 3) return '#ff0000';
  if (seconds <= 5) return '#ff4500';
  if (seconds <= 10) return '#ffa500';
  return '#fff5d4';
};

interface BetResult {
  won: boolean;
  profit: number;
  initialPrice: number;
  finalPrice: number;
  timestamp: string;
}

interface BettingInterfaceProps {
  isBetting: boolean;
  currentBet: 'up' | 'down' | null;
  betPrice: number | null;
  timer: number | null;
  username: string;
  clientId: string;
  currency: string;
  prices: Array<{timestamp: string; price: number}>;
  setIsBetting: (value: boolean) => void;
  setCurrentBet: (value: 'up' | 'down' | null) => void;
  setBetPrice: (value: number | null) => void;
  setTimer: React.Dispatch<React.SetStateAction<number | null>>;
  winSoundRef: React.RefObject<HTMLAudioElement | null>;
  loseSoundRef: React.RefObject<HTMLAudioElement | null>;
  score: number;
  setScore: (score: number) => void;
  updateScoreWithAnimation: (score: number) => void;
  gameStarted: boolean;
  onWin: () => void;
  gameStatsRef: React.RefObject<HTMLDivElement>;
  isMobile: boolean;
  isMusicPlaying: boolean;
}

export const BettingInterface: React.FC<BettingInterfaceProps> = ({
  isBetting,
  currentBet,
  betPrice,
  timer,
  username,
  clientId,
  currency,
  prices,
  setIsBetting,
  setCurrentBet,
  setBetPrice,
  setTimer,
  winSoundRef,
  loseSoundRef,
  score,
  setScore,
  updateScoreWithAnimation,
  gameStarted,
  onWin,
  gameStatsRef,
  isMobile,
  isMusicPlaying,
}) => {
  const [isCheckingStatus, setIsCheckingStatus] = React.useState(false);
  const [showWinMessage, setShowWinMessage] = React.useState(false);
  const [lastWasWin, setLastWasWin] = React.useState(true);
  const [isBetBoxHovered, setIsBetBoxHovered] = React.useState(false);
  const statusCheckTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const handlePlaceBet = async (type: 'up' | 'down') => {
    try {
      console.log('Placing bet:', { type, username, clientId, currency });

      // Clear any existing timers
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (statusCheckTimeoutRef.current) {
        clearTimeout(statusCheckTimeoutRef.current);
      }

      const currentPrice = prices[prices.length - 1]?.price || 0;
      setBetPrice(currentPrice);
      setIsBetting(true);
      setCurrentBet(type);
      setTimer(BET_TIMER / 1000);

      const data = await api.placeBet({
        userId: clientId,
        username,
        currency,
        betType: type,
        priceAtBet: currentPrice,
      });

      // Store the betId
      setCurrentBetId(data.betId);

      // Store the new interval
      countdownIntervalRef.current = setInterval(() => {
        setTimer((prevTimer:any) => {
          if (prevTimer === null || prevTimer <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            // Trigger the status check
            setIsCheckingStatus(true);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error placing bet:', error);
      setIsBetting(false);
      setCurrentBet(null);
      setCurrentBetId(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  };

  const handleBetComplete = React.useCallback((result: BetResult) => {
    console.log('Handling bet completion:', result);
    console.log('Result won:', result.won, typeof result.won);

    setShowWinMessage(true);
    setLastWasWin(result.won);

    if (result.won) {
      const newScore = score + result.profit;
      setScore(newScore);
      
      if (isMusicPlaying && winSoundRef.current) {
        winSoundRef.current.volume = 0.5;
        const playPromise = winSoundRef.current.play();
        if (playPromise) {
          playPromise.catch(error => {
            console.log('Sound play prevented:', error);
          });
        }
      }
      
      onWin();
      setTimeout(() => updateScoreWithAnimation(newScore), 500);
    } else {
      const newScore = Math.max(0, score - Math.abs(result.profit));
      setScore(newScore);
      updateScoreWithAnimation(newScore);
      
      if (isMusicPlaying && loseSoundRef.current) {
        loseSoundRef.current.volume = 0.5;
        const playPromise = loseSoundRef.current.play();
        if (playPromise) {
          playPromise.catch(error => {
            console.log('Sound play prevented:', error);
          });
        }
      }
    }

    // Reset all states after delay
    setTimeout(() => {
      console.log('Resetting bet states');
      setShowWinMessage(false);
      setIsBetting(false);
      setCurrentBet(null);
      setBetPrice(null);
      setTimer(null);
      setCurrentBetId(null);
    }, 3000);
  }, [score, setScore, updateScoreWithAnimation, onWin, winSoundRef, loseSoundRef, isMusicPlaying]);

  // Add state for storing betId
  const [currentBetId, setCurrentBetId] = React.useState<string | null>(null);

  // Use effect to handle bet status checking
  React.useEffect(() => {
    let isSubscribed = true;

    const checkBetStatus = async (betId: string) => {
      if (!isCheckingStatus) return;

      try {
        const data = await api.checkBetStatus(betId);
        console.log('Got bet status:', data);
        
        if (!isSubscribed) return;

        if (data.status === 'completed') {
          console.log('🎲 Bet completed, calling handleBetComplete');
          setIsCheckingStatus(false);
          if (data.result) {
            handleBetComplete(data.result);
          } else {
            handleBetComplete({
              won: false,
              profit: 1,
              initialPrice: betPrice || 0,
              finalPrice: prices[prices.length - 1]?.price || 0,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          // Schedule next check
          statusCheckTimeoutRef.current = setTimeout(() => {
            if (isSubscribed) {
              checkBetStatus(betId);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error checking bet status:', error);
        if (isSubscribed) {
          statusCheckTimeoutRef.current = setTimeout(() => {
            checkBetStatus(betId);
          }, 100);
        }
      }
    };

    if (isCheckingStatus && currentBetId) {
      checkBetStatus(currentBetId);
    }

    return () => {
      isSubscribed = false;
      if (statusCheckTimeoutRef.current) {
        clearTimeout(statusCheckTimeoutRef.current);
      }
    };
  }, [isCheckingStatus, currentBetId, betPrice, prices, handleBetComplete]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (statusCheckTimeoutRef.current) {
        clearTimeout(statusCheckTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return gameStarted ? (
    <>
      <WinLoseMessage 
        showWinMessage={showWinMessage}
        timer={timer}
        lastWasWin={lastWasWin}
        winSoundRef={winSoundRef}
        loseSoundRef={loseSoundRef}
      />

      <div 
        className="bet-box"
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'auto',
          padding: '15px',
          border: '4px solid white',
          borderImage: isBetBoxHovered 
            ? 'linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.98) 20%, rgba(255, 255, 255, 0.98) 80%, transparent 100%) 1'
            : 'linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.4) 20%, rgba(255, 255, 255, 0.4) 80%, transparent 100%) 1',
          background: 'rgba(0, 0, 0, 0.2)',
          zIndex: 10,
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isBetBoxHovered 
            ? '0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.25)'
            : '0 0 10px rgba(255, 255, 255, 0.1), inset 0 0 5px rgba(255, 255, 255, 0.05)',
          minHeight: '120px',
          minWidth: '300px',
          display: showWinMessage ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '10px' : '16px',
        }}
        onMouseEnter={() => setIsBetBoxHovered(true)}
        onMouseLeave={() => setIsBetBoxHovered(false)}
      >
        <div style={{
          color: '#fff5d4',
          fontFamily: "'Press Start 2P', cursive",
          fontSize: isMobile ? '8px' : '12px',
          marginBottom: '15px',
          textAlign: 'center',
          textShadow: '2px 2px 0px rgba(0,0,0,0.5)'
        }}>
          {isBetting ? (
            <>
              <div style={{
                color: '#fff5d4',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: isMobile ? '8px' : '12px',
                textAlign: 'center',
                marginBottom: '10px'
              }}>
                Your bet: {currentBet === 'up' ? '🟢 UP' : '🔴 DOWN'}<br/>
                Price: ${betPrice?.toFixed(2)}
              </div>
              <div style={{
                color: getTimerColor(timer || 0),
                fontFamily: "'Press Start 2P', cursive",
                fontSize: isMobile ? '16px' : '24px',
                textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                transition: 'color 0.3s ease'
              }}>
                {formatTimer(timer)}
              </div>
            </>
          ) : (
            'Place your bet:'
          )}
        </div>
        {!isBetting && (
          <div style={{
            display: 'flex',
            gap: '20px',
          }}>
            <button
              onClick={() => handlePlaceBet('up')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 8px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
              style={{
                padding: '10px 30px',
                fontSize: isMobile ? '10px' : '14px',
                fontFamily: "'Press Start 2P', cursive",
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              UP
            </button>
            <button
              onClick={() => handlePlaceBet('down')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 8px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
              style={{
                padding: '10px 30px',
                fontSize: isMobile ? '10px' : '14px',
                fontFamily: "'Press Start 2P', cursive",
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              DOWN
            </button>
          </div>
        )}
      </div>
    </>
  ) : null;
}; 