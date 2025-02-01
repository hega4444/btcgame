import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Container,
  Box,
  Title,
  TitleLine,
  Letter,
  PlayButton,
  CoinContainer,
  TopCoinContainer,
  CoinSprite,
  TopCoinSprite,
  Dialog,
  DialogContent,
  DialogButton,
  Input,
  GameContainer,
  CloseButton,
  Bubble,
  BubbleContainer,
  GameStats,
  TopButton,
  LeaderboardDialog,
  LeaderboardItem,
  BitcoinPrice
} from './styles';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend
} from 'chart.js';
import { mockPrices } from './mockData/bitcoinPrices';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend
);

// Add this type near other type definitions
type ScoreDigit = {
  value: string;
  key: number;
  isAnimating: boolean;
};

// Add these new types near other type definitions
type CoinAnimation = {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

const App: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [username, setUsername] = useState('');
  const [hasAccepted, setHasAccepted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [devMode] = useState(() => localStorage.getItem('btcGameDevMode') === 'true');
  const ALWAYS_SHOW_DIALOG = true; // Dev flag - set to false for production
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [score, setScore] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isBetting, setIsBetting] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [isBetBoxHovered, setIsBetBoxHovered] = useState(false);
  const [currentBet, setCurrentBet] = useState<'up' | 'down' | null>(null);
  const [betPrice, setBetPrice] = useState<number | null>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Add these new states
  const [scoreDigits, setScoreDigits] = useState<ScoreDigit[]>([{ value: '0', key: 0, isAnimating: false }]);
  const [lastWinTime, setLastWinTime] = useState<number>(0);

  // Add new state for coin animations
  const [winningCoins, setWinningCoins] = useState<CoinAnimation[]>([]);
  const gameStatsRef = useRef<HTMLDivElement>(null);
  const betBoxRef = useRef<HTMLDivElement>(null);

  // Add new states at the top with other states
  const [showWinMessage, setShowWinMessage] = useState(false);
  const [lastWasWin, setLastWasWin] = useState(true);

  // Add new state for audio
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);

  // Add this near the top with other state declarations
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Add this effect to handle window resizing
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // In dev mode, clear localStorage and reset states
    if (devMode) {
      localStorage.removeItem('btcGameAccepted');
      localStorage.removeItem('btcGameUsername');
      setHasAccepted(false);
      setUsername('');
      return;
    }

    const accepted = localStorage.getItem('btcGameAccepted');
    const savedUsername = localStorage.getItem('btcGameUsername');
    console.log('Initial load - accepted:', accepted, 'username:', savedUsername);
    if (!ALWAYS_SHOW_DIALOG && accepted === 'true' && savedUsername) {
      setHasAccepted(true);
      setUsername(savedUsername);
    }
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('YOUR_API_ENDPOINT_HERE');
        if (!response.ok) {
          throw new Error('API response was not ok');
        }
        const data = await response.json();
        setPrices(data.slice(-12));
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
        setPrices(mockPrices);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (prices === mockPrices) {
      const updateMockPrices = () => {
        const lastPrice = prices[prices.length - 1].price;
        const newPrice = lastPrice + (Math.random() * 200 - 100); // Random price change
        const newTimestamp = new Date().toISOString();
        
        setPrices(prevPrices => [
          ...prevPrices.slice(1),
          { timestamp: newTimestamp, price: newPrice }
        ]);
      };

      const mockInterval = setInterval(updateMockPrices, 15000);
      return () => clearInterval(mockInterval);
    }
  }, [prices]);

  const handlePlay = () => {
    console.log('Play clicked - Current state:', {
      hasAccepted,
      showDialog,
      username
    });
    
    // Hide play button immediately
    setShowPlayButton(false);
    
    if (ALWAYS_SHOW_DIALOG || !hasAccepted) {
      console.log('🔴 SHOWING DIALOG - setting showDialog to true');
      // Set username to hega4444 if in dev mode before showing dialog
      if (devMode) {
        setUsername('hega4444');
      }
      setShowDialog(true);
      // Focus the input after a short delay to ensure the dialog is rendered
      setTimeout(() => {
        usernameInputRef.current?.focus();
      }, 100);
    } else {
      startGame();
    }
  };

  const handleAccept = () => {
    console.log('Accept clicked, username:', username);
    if (username.trim()) {
      localStorage.setItem('btcGameAccepted', 'true');
      localStorage.setItem('btcGameUsername', username);
      setHasAccepted(true);
      setShowDialog(false);
      // Don't show play button when accepting
      startGame();
    }
  };

  const startGame = () => {
    console.log('Starting game...');
    setGameStarted(true);
    // Additional game logic will go here
  };

  const handleClose = () => {
    setShowDialog(false);
    // Show play button again when dialog is closed with X
    setShowPlayButton(true);
  };

  const titleLine1 = "Bitcoin";
  const titleLine2 = "Game";

  // Move bubble generation outside render cycle and memoize it
  const bubbles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      size: Math.random() * 50 + 20,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * -20,
      left: Math.random() * 100,
      key: i
    }));
  }, []); // Empty dependency array means this only runs once

  // Memoize the username change handler
  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  }, []);

  // Mocked leaderboard data
  const leaderboardData = useMemo(() => [
    { username: "CryptoKing", score: 2500 },
    { username: "BitcoinQueen", score: 2350 },
    { username: "SatoshiLover", score: 2200 },
    { username: "BlockMaster", score: 2050 },
    { username: "CoinHunter", score: 1900 },
    { username: "HashRider", score: 1800 },
    { username: "ChainGuru", score: 1700 },
    { username: "BTCWizard", score: 1600 },
    { username: "MoonHolder", score: 1500 },
    { username: "DiamondHands", score: 1400 }
  ], []);

  // Add this type definition
  type PriceData = {
    timestamp: string;
    price: number;
  };

  // Update the chart data configuration with glow effect
  const chartData = {
    labels: prices.map(p => new Date(p.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Bitcoin Price',
        data: prices.map(p => p.price),
        borderColor: 'rgb(255, 255, 0)',
        backgroundColor: 'rgba(255, 255, 0, 0.1)',
        borderWidth: 4,
        tension: 0.4,
        fill: true,
        shadowBlur: 20,
        shadowColor: 'rgba(255, 255, 0, 0.6)',
        borderDash: [],
        pointBackgroundColor: 'rgb(255, 255, 0)',
        pointBorderColor: 'rgba(255, 255, 0, 0.9)',
        pointHoverBackgroundColor: 'rgb(255, 255, 0)',
        pointHoverBorderColor: 'rgba(255, 255, 0, 1)',
        pointRadius: 5,
        pointHoverRadius: 8,
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
      },
    ],
  };

  // Update the chart options to enhance glow effect
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        titleFont: {
          family: "'Press Start 2P', cursive",
          size: 10
        },
        bodyFont: {
          family: "'Press Start 2P', cursive",
          size: 10
        },
        padding: 10,
        animation: {
          duration: 200
        },
        position: 'nearest',
        intersect: true,
        mode: 'nearest',
        delay: 0,
      },
      // Add shadow plugin configuration
      shadow: {
        enabled: true,
        color: 'rgba(176, 212, 46, 0.3)',
        blur: 10,
        offsetX: 0,
        offsetY: 4
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            family: "'Press Start 2P', cursive",
            size: 10,
            weight: 'bold',
          },
          maxRotation: 45,
          minRotation: 45,
          padding: 10,
          callback: function(value: any, index: number, ticks: any[]) {
            // Check if it's mobile (screen width less than 768px)
            if (window.innerWidth < 768) {
              // Show only first and last labels
              return index === 0 || index === ticks.length - 1 ? this.getLabelForValue(value) : '';
            }
            // Show all labels on desktop
            return this.getLabelForValue(value);
          },
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.15)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            family: "'Press Start 2P', cursive",
            size: 10,
            weight: 'bold',
          },
          padding: 15, // Increased padding between ticks and labels
        },
        afterFit: (scaleInstance: any) => {
          scaleInstance.width = scaleInstance.width + 20; // Add more width for y-axis labels
        },
      },
    },
    layout: {
      padding: {
        left: window.innerWidth < 768 ? 5 : 25,
        right: window.innerWidth < 768 ? 5 : 25,
        top: window.innerWidth < 768 ? 15 : 25,
        bottom: window.innerWidth < 768 ? 15 : 25,
      },
    },
    elements: {
      line: {
        borderWidth: 4,
        borderColor: 'rgb(255, 255, 0)',
        backgroundColor: 'transparent',
        tension: 0.4,
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
        shadowBlur: 20,
        shadowColor: 'rgba(255, 255, 0, 0.6)',
      },
      point: {
        radius: 5,
        borderWidth: 2,
        backgroundColor: 'rgb(255, 255, 0)',
        borderColor: 'rgba(255, 255, 0, 0.9)',
        hoverRadius: 8,
        hoverBorderWidth: 3,
        shadowBlur: 15,
        shadowColor: 'rgba(255, 255, 0, 0.6)',
      }
    },
    interaction: {
      intersect: true,
      mode: 'nearest',
      axis: 'xy',
      threshold: 25,
      includeInvisible: false,
      events: ['mousemove', 'mouseout'],
    },
  };

  // Update the updateScoreWithAnimation function
  const updateScoreWithAnimation = useCallback((newScore: number) => {
    const digits = newScore.toString().split('');
    const now = Date.now();
    
    // Create new score digits with animation flag and sequential delays
    const newScoreDigits = digits.map((digit, index) => ({
      value: digit,
      key: now + index,
      isAnimating: true
    }));
    
    setScoreDigits(newScoreDigits);
    setLastWinTime(now);

    // Reset animation flags after animation completes
    setTimeout(() => {
      setScoreDigits(digits.map((digit, index) => ({
        value: digit,
        key: now + index,
        isAnimating: false
      })));
    }, 1000); // Increased duration to account for sequential animations
  }, []);

  // Add this function to calculate coin animation positions
  const createCoinAnimation = useCallback(() => {
    if (!betBoxRef.current || !gameStatsRef.current) return;

    const betBox = betBoxRef.current.getBoundingClientRect();
    const gameStats = gameStatsRef.current.getBoundingClientRect();

    const startX = betBox.left + betBox.width / 2;
    const startY = betBox.top + betBox.height / 2;
    const endX = gameStats.left + gameStats.width / 2;
    const endY = gameStats.top + gameStats.height / 2;

    const newCoin: CoinAnimation = {
      id: Date.now(),
      startX,
      startY,
      endX,
      endY
    };

    setWinningCoins(prev => [...prev, newCoin]);

    // Update timeout to match new animation duration
    setTimeout(() => {
      setWinningCoins(prev => prev.filter(coin => coin.id !== newCoin.id));
    }, 2000); // Match the 2s animation duration
  }, []);

  // Add this effect to initialize the win sound
  useEffect(() => {
    winSoundRef.current = new Audio('/assets/coin_c_02-102844.mp3');
    winSoundRef.current.volume = 0.4;
    
    loseSoundRef.current = new Audio('/assets/violin-lose-4-185125.mp3');
    loseSoundRef.current.volume = 0.3; // Slightly lower volume for lose sound
    
    return () => {
      if (winSoundRef.current) {
        winSoundRef.current = null;
      }
      if (loseSoundRef.current) {
        loseSoundRef.current = null;
      }
    };
  }, []);

  // Update the timer interval callback in handlePlaceBet
  const handlePlaceBet = (direction: 'up' | 'down') => {
    setIsBetting(true);
    setTimer(2);
    setCurrentBet(direction);
    setBetPrice(prices[prices.length - 1]?.price || null);
    
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer === null || prevTimer <= 1) {
          clearInterval(interval);
          
          const isWinning = lastWasWin;
          
          if (isWinning) {
            // Play win sound when winning
            if (winSoundRef.current && isMusicPlaying) {
              winSoundRef.current.currentTime = 0;
              winSoundRef.current.play().catch(err => console.log('Win sound play failed:', err));
            }
            
            const newScore = score + 1;
            setScore(newScore);
            updateScoreWithAnimation(newScore);
            createCoinAnimation();
          } else {
            // Play lose sound when losing
            if (loseSoundRef.current && isMusicPlaying) {
              loseSoundRef.current.currentTime = 0;
              loseSoundRef.current.play().catch(err => console.log('Lose sound play failed:', err));
            }
          }
          
          setShowWinMessage(true);
          setLastWasWin(!lastWasWin);
          
          setTimeout(() => {
            setShowWinMessage(false);
            setIsBetting(false);
            setCurrentBet(null);
            setBetPrice(null);
          }, 1500);
          
          return null;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  // Add this helper function to format the timer
  const formatTimer = (seconds: number | null) => {
    if (seconds === null) return '0:00';
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  // Update the getTimerColor function
  const getTimerColor = (seconds: number) => {
    if (seconds <= 3) return '#ff0000';
    if (seconds <= 5) return '#ff4500';
    if (seconds <= 10) return '#ffa500';
    return '#fff5d4'; // Changed from '#ffffff' to a soft yellow-white
  };

  // Add this new handler function near the other handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && username.trim()) {
      handleAccept();
    }
  };

  // Update the style block creation and injection
  const createStyles = (winningCoins: CoinAnimation[]) => {
    const styleElement = document.getElementById('game-animations') || document.createElement('style');
    styleElement.id = 'game-animations';
    
    styleElement.textContent = `
      @keyframes scorePopup {
        0% { 
          transform: scale(1);
          color: #2e7d32;
        }
        50% { 
          transform: scale(1.8);
          color: #4CAF50;
        }
        100% { 
          transform: scale(1);
          color: #2e7d32;
        }
      }

      @keyframes spinCoin {
        0% { background-position-x: 0%; }
        100% { background-position-x: -600%; }
      }

      @keyframes winMessagePopup {
        0% { 
          transform: scale(0.5);
          opacity: 0;
        }
        100% { 
          transform: scale(1);
          opacity: 1;
        }
      }

      ${winningCoins.map(coin => `
        @keyframes moveCoin${coin.id} {
          0% {
            left: ${coin.startX}px;
            top: ${coin.startY}px;
            transform: translate(-50%, -50%) scale(2);
            opacity: 1;
          }
          100% {
            left: ${coin.endX}px;
            top: ${coin.endY}px;
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
        }
      `).join('\n')}
    `;

    if (!document.getElementById('game-animations')) {
      document.head.appendChild(styleElement);
    }
  };

  // Add this effect to update styles when coins change
  useEffect(() => {
    createStyles(winningCoins);
  }, [winningCoins]);

  // Update the audio initialization useEffect
  useEffect(() => {
    const initAndPlayAudio = async () => {
      if (!audioRef.current) {
        audioRef.current = new Audio('/assets/little-slimex27s-adventure-151007.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
        audioRef.current.preload = 'auto';
        
        // Set initial music playing state to true
        setIsMusicPlaying(true);
        
        try {
          // Try to play immediately
          await audioRef.current.play();
          console.log('Audio started playing');
        } catch (error) {
          console.log('Autoplay prevented:', error);
          
          // Set up to play on first user interaction
          const playOnInteraction = () => {
            if (audioRef.current) {
              audioRef.current.play()
                .then(() => {
                  console.log('Audio started on user interaction');
                  // Remove listeners after successful play
                  document.removeEventListener('click', playOnInteraction);
                  document.removeEventListener('touchstart', playOnInteraction);
                  document.removeEventListener('keydown', playOnInteraction);
                })
                .catch(err => console.log('Play on interaction failed:', err));
            }
          };

          // Add listeners for various user interactions
          document.addEventListener('click', playOnInteraction);
          document.addEventListener('touchstart', playOnInteraction);
          document.addEventListener('keydown', playOnInteraction);
        }
      }
    };

    // Initialize audio when component mounts
    initAndPlayAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update the visibility change effect to respect the isMusicPlaying state
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (audioRef.current) {
        if (document.hidden) {
          audioRef.current.pause();
        } else if (isMusicPlaying) {
          audioRef.current.play().catch(err => console.log('Resume on visibility change failed:', err));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isMusicPlaying]);

  // Add this effect to handle isMusicPlaying state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.play().catch(err => console.log('Play on state change failed:', err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMusicPlaying]);

  return (
    <Container>
      <GameContainer>
        <Box>
          {/* Chart Container - Now always visible */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: window.innerWidth < 768 ? '98%' : '90%',
            height: '80vh',
            maxHeight: '600px',
            borderRadius: '10px',
            padding: window.innerWidth < 768 ? '5px' : '20px',
            zIndex: 1,
            opacity: gameStarted ? 1 : 0.3,
            transition: 'opacity 0.5s ease',
          }}>
            {/* Add BitcoinPrice above the chart */}
            <BitcoinPrice style={{
              position: 'absolute',
              top: isMobile ? '20px' : '-10px',
              right: isMobile ? '10px' : '20px',
              zIndex: 2,
              opacity: gameStarted ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}>
              <span>BTC:</span>
              $45,123
            </BitcoinPrice>
            <Line data={chartData} options={chartOptions} />
          </div>

          {gameStarted && (
            <>
              <GameStats ref={gameStatsRef}>
                <div style={{ color: '#2e7d32' }}>{username}</div>
                <div style={{ color: '#2e7d32', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      animation: scoreDigits[0]?.isAnimating 
                        ? `scorePopup 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)` 
                        : 'none',
                    }}
                  >
                    Score:
                  </span>
                  <div style={{ display: 'flex' }}>
                    {scoreDigits.map((digit, index) => (
                      <span
                        key={digit.key}
                        style={{
                          display: 'inline-block',
                          animation: digit.isAnimating 
                            ? `scorePopup 0.5s ${index * 0.1}s cubic-bezier(0.175, 0.885, 0.32, 1.275)` 
                            : 'none',
                        }}
                      >
                        {digit.value}
                      </span>
                    ))}
                  </div>
                </div>
              </GameStats>
              <TopButton onClick={() => setShowLeaderboard(true)} style={{ color: '#2e7d32' }}>
                TOP 10 <br />PLAYERS
              </TopButton>

              {/* Betting UI Container */}
              <div 
                ref={betBoxRef}
                onMouseEnter={() => setIsBetBoxHovered(true)}
                onMouseLeave={() => setIsBetBoxHovered(false)}
                style={{
                  position: 'fixed',
                  bottom: '40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
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
                }}>
                {!isBetting ? (
                  <>
                    <div style={{
                      color: '#fff5d4',
                      fontFamily: "'Press Start 2P', cursive",
                      fontSize: '16px',
                      marginBottom: '15px',
                      textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                    }}>
                      Place bet:
                    </div>
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
                          fontSize: '14px',
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
                          fontSize: '14px',
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
                  </>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    {showWinMessage ? (
                      <div style={{
                        color: lastWasWin ? '#f44336' : '#4CAF50',
                        fontFamily: "'Press Start 2P', cursive",
                        fontSize: '32px',
                        textAlign: 'center',
                        textShadow: '3px 3px 0px rgba(0,0,0,0.5)',
                        animation: 'winMessagePopup 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        padding: '20px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '10px',
                        border: `2px solid ${lastWasWin ? '#f44336' : '#4CAF50'}`
                      }}>
                        {lastWasWin ? 'KEEP TRYING!' : 'YOU WIN!'}
                      </div>
                    ) : (
                      <>
                        <div style={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontFamily: "'Press Start 2P', cursive",
                          fontSize: '12px',
                          textAlign: 'center'
                        }}>
                          Your bet: {currentBet === 'up' ? '🟢 UP' : '🔴 DOWN'}<br/>
                          Price: ${betPrice?.toFixed(2)}
                        </div>
                        <div style={{
                          color: getTimerColor(timer || 0),
                          fontFamily: "'Press Start 2P', cursive",
                          fontSize: '24px',
                          padding: '10px 30px',
                          textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                          transition: 'color 0.3s ease'
                        }}>
                          {formatTimer(timer)}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Add the coin animations */}
              {winningCoins.map(coin => (
                <div
                  key={coin.id}
                  style={{
                    position: 'fixed',
                    left: `${coin.startX}px`,
                    top: `${coin.startY}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    animation: `moveCoin${coin.id} 2s cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
                    pointerEvents: 'none',
                  }}
                >
                  <CoinSprite style={{ width: '80px', height: '80px' }} />
                </div>
              ))}
            </>
          )}

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

          <div style={{
            transform: gameStarted ? 'translateY(-150vh)' : 'translateY(0)',
            transition: 'transform 0.5s ease',
            position: 'relative',
            zIndex: 2, // Higher z-index to stay above the chart
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            gap: 'clamp(2rem, 5vh, 4rem)'
          }}>
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

          {showDialog && (
            <Dialog style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(20, 30, 45, 0.95)',
              padding: '20px',
              zIndex: 1000,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              borderRadius: '20px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              minWidth: '300px',
              width: '90vw',
              maxWidth: '400px',
              fontFamily: "'Press Start 2P', cursive"
            }}>
              <CloseButton onClick={handleClose}>×</CloseButton>
              <DialogContent>
                <h2 style={{ 
                  color: 'white', 
                  marginTop: '0',
                  fontSize: '1.4em',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}>Welcome to Bitcoin Game!</h2>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.9em',
                  lineHeight: '1.5'
                }}>Guess if Bitcoin's price will go up or down in the next minute to win points!</p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  width: '100%'
                }}>
                  <Input
                    ref={usernameInputRef}
                    type="text"
                    placeholder="USERNAME"
                    value={username}
                    onChange={handleUsernameChange}
                    onKeyDown={handleKeyDown}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      fontSize: '0.9em',
                      outline: 'none',
                      width: '80%',
                      maxWidth: '300px',
                      boxSizing: 'border-box',
                      marginBottom: '10px',
                      textAlign: 'center',
                      fontFamily: "'Press Start 2P', cursive",
                      '::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.8em'
                      }
                    }}
                  />
                </div>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '0.8em'
                }}>This game uses cookies to save your scores and progress.</p>
                <DialogButton 
                  onClick={handleAccept} 
                  disabled={!username.trim()}
                  style={{
                    backgroundColor: '#FFEB3B',
                    color: '#000',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '0.9em',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontFamily: "'Press Start 2P', cursive",
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      backgroundColor: '#FFF176',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                    }
                  }}
                >
                  Accept & Play
                </DialogButton>
              </DialogContent>
            </Dialog>
          )}

          {showLeaderboard && (
            <LeaderboardDialog>
              <CloseButton onClick={() => setShowLeaderboard(false)}>×</CloseButton>
              <h2>TOP 10 PLAYERS</h2>
              {leaderboardData.map((player, index) => (
                <LeaderboardItem key={index}>
                  <span>{index + 1}.</span>
                  <span>{player.username}</span>
                  <span>{player.score}</span>
                </LeaderboardItem>
              ))}
            </LeaderboardDialog>
          )}

          {/* Audio control button */}
          <div 
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
              cursor: 'pointer',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: isMobile ? '50%' : '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Press Start 2P', cursive",
              fontSize: '16px',
              color: '#fff',
              transition: 'all 0.2s ease',
            }} 
            onClick={() => setIsMusicPlaying(!isMusicPlaying)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>{isMusicPlaying ? '🔊' : '🔈'}</span>
            {!isMobile && (
              <span style={{ 
                fontSize: '12px',
                opacity: 0.7
              }}>
                AUDIO {isMusicPlaying ? 'ON' : 'OFF'}
              </span>
            )}
          </div>
        </Box>
      </GameContainer>
    </Container>
  );
};

export default React.memo(App); 