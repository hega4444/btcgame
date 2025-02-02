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
  BitcoinPrice,
  moveCoin,
  CoinAnimationContainer
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
import { getClientId } from './utils/clientId';

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

// Add these types
interface PlaceBetResponse {
  betId: string;
  message: string;
  priceAtBet: number;
  timestamp: string;
}

interface BetResult {
  won: boolean;
  profit: number;
  initialPrice: number;
  finalPrice: number;
  timestamp: string;
}

interface BetStatusResponse {
  status: 'active' | 'completed';
  result?: BetResult;
  bet?: {
    betType: 'up' | 'down';
    priceAtBet: number;
    timestamp: string;
  };
}

// Add new interface
interface RegisterUserResponse {
  username: string;
  clientId: string;
  message: string;
}

// Debug logging for environment variables
console.log('Environment Variables:', {
  VITE_USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE
});

// Add this helper at the top of the file with more explicit checks
const USE_MOCK_DATA = (() => {
  const mockDataEnv = import.meta.env.VITE_USE_MOCK_DATA;
  console.log('VITE_USE_MOCK_DATA value:', mockDataEnv);
  return mockDataEnv === 'true';
})();

const API_URL = (() => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  console.log('API_URL value:', apiUrl);
  return apiUrl;
})();

// Update the BET_TIMER constant near the top with other constants
const BET_TIMER = (() => {
  const timerFromEnv = import.meta.env.VITE_BET_TIMER_SECONDS;
  const defaultTimer = 60; // 60 seconds default
  const timer = timerFromEnv ? parseInt(timerFromEnv) : defaultTimer;
  console.log('BET_TIMER value:', timer, 'seconds');
  return timer * 1000; // Convert to milliseconds
})();

const App: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [username, setUsername] = useState('');
  const [hasAccepted, setHasAccepted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [devMode] = useState(() => localStorage.getItem('btcGameDevMode') === 'true');
  const ALWAYS_SHOW_DIALOG = false; // Dev flag - set to false for production
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

  // Add these new states at the top with other states
  const [showSettings, setShowSettings] = useState(false);
  const [currency, setCurrency] = useState('USD');

  // Add state for active bet
  const [activeBetId, setActiveBetId] = useState<string | null>(null);

  // Add userId state
  const [userId, setUserId] = useState<string | null>(null);

  // Add new state for bet result
  const [betResult, setBetResult] = useState<BetResult | null>(null);

  // Add this state to track if we're currently checking status
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Add this ref to store the interval
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add this ref to track the status check timeout
  const statusCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add this helper function to format the timer
  const formatTimer = (seconds: number | null) => {
    if (seconds === null) return '0:00';
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  // Add this helper function for timer color
  const getTimerColor = (seconds: number) => {
    if (seconds <= 3) return '#ff0000';
    if (seconds <= 5) return '#ff4500';
    if (seconds <= 10) return '#ffa500';
    return '#fff5d4';
  };

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

  // Update the price fetching function
  const fetchPrices = useCallback(async () => {
    try {
      if (USE_MOCK_DATA) {
        // Use mock data
        const mockPrice = mockPrices[Math.floor(Math.random() * mockPrices.length)];
        setPrices(prev => [...prev.slice(-19), mockPrice]);
        return;
      }

      // Use real API
      const response = await fetch(`${API_URL}/api/bitcoin/prices/${currency.toLowerCase()}`);
      if (!response.ok) throw new Error('Failed to fetch prices');
      
      const data = await response.json();
      setPrices(data.prices || []); // Add fallback empty array

    } catch (error) {
      console.error('Error fetching prices:', error);
      // Fallback to mock data on error
      const mockPrice = mockPrices[Math.floor(Math.random() * mockPrices.length)];
      setPrices(prev => [...prev.slice(-19), mockPrice]);
    }
  }, [currency]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);

    return () => clearInterval(interval);
  }, [fetchPrices]);

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
    console.log('Play clicked');
    setShowPlayButton(false);
    
    if (!hasAccepted) {
      setShowDialog(true);
      setTimeout(() => {
        usernameInputRef.current?.focus();
      }, 100);
    } else {
      startGame();
    }
  };

  const handleAccept = async () => {
    if (!username) {
      return;
    }

    try {
      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username,
          clientId: getClientId()  // Use client ID from cookie/storage
        })
      });

      const data: RegisterUserResponse = await response.json();
      
      if (response.ok) {
        setHasAccepted(true);
        setShowDialog(false);
        setGameStarted(true);
      } else {
        alert(data.message || 'Failed to register user');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      alert('Failed to register user. Please try again.');
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
  const handlePlaceBet = async (type: 'up' | 'down') => {
    try {
      // Clear any existing timers
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (statusCheckTimeoutRef.current) {
        clearTimeout(statusCheckTimeoutRef.current);
      }

      const currentPrice = prices[prices.length - 1]?.price || 0;
      setBetPrice(currentPrice);  // Set the bet price
      setIsBetting(true);
      setCurrentBet(type);
      setTimer(BET_TIMER / 1000);
      setIsCheckingStatus(false);

      if (USE_MOCK_DATA) {
        // Mock data handling
        countdownIntervalRef.current = setInterval(() => {
          setTimer(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownIntervalRef.current!);
              const mockResult: BetResult = {
                won: Math.random() > 0.5,
                profit: 1,
                initialPrice: prices[prices.length - 2]?.price || 0,
                finalPrice: prices[prices.length - 1]?.price || 0,
                timestamp: new Date().toISOString()
              };
              handleBetComplete(mockResult);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return;
      }

      const response = await fetch(`${API_URL}/api/place-bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getClientId(),
          username,
          currency,
          betType: type,
          priceAtBet: prices[prices.length - 1]?.price || 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to place bet');
      
      const data = await response.json();
      const betId = data.betId;

      // Store the new interval
      countdownIntervalRef.current = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer === null || prevTimer <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            checkBetStatus(betId);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error placing bet:', error);
      setIsBetting(false);
      setCurrentBet(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (statusCheckTimeoutRef.current) {
        clearTimeout(statusCheckTimeoutRef.current);
      }
    };
  }, []);

  // Add this helper function near the top with other functions
  const formatCurrency = (amount: number, currencyCode: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formatter.format(amount);
  };

  // Add this effect to handle score digit updates
  useEffect(() => {
    // Convert score to digits array
    const digits = Math.abs(score).toString().split('').map((digit, index) => ({
      value: digit,
      key: Date.now() + index,
      isAnimating: true
    }));

    // Add minus sign if negative
    if (score < 0) {
      digits.unshift({
        value: '-',
        key: Date.now() - 1,
        isAnimating: true
      });
    }

    // If score is 0, show single 0
    if (score === 0) {
      setScoreDigits([{
        value: '0',
        key: Date.now(),
        isAnimating: false
      }]);
      return;
    }

    setScoreDigits(digits);

    // Reset animation flag after animation completes
    const timer = setTimeout(() => {
      setScoreDigits(prev => prev.map(digit => ({
        ...digit,
        isAnimating: false
      })));
    }, 500);

    return () => clearTimeout(timer);
  }, [score]); // This effect runs whenever score changes

  // Add this handler function
  const handleResetScore = () => {
    setScore(0);
    setScoreDigits([{ value: '0', key: Date.now(), isAnimating: false }]);
  };

  // Function to handle bet completion
  const handleBetComplete = (result: BetResult) => {
    console.log('Handling bet completion:', result);

    // Set result first
    setBetResult(result);
    setShowWinMessage(true);
    setLastWasWin(!result.won);

    if (result.won) {
      // Calculate new score
      const newScore = score + result.profit;
      setScore(newScore);
      
      // Play win sound
      if (winSoundRef.current) {
        winSoundRef.current.currentTime = 0;
        winSoundRef.current.play().catch(console.error);
      }
      
      // Add coin animation
      if (gameStatsRef.current) {
        const rect = gameStatsRef.current.getBoundingClientRect();
        addWinningCoins(rect);
      }

      // Animate score after a delay
      setTimeout(() => {
        updateScoreWithAnimation(newScore);
      }, 500);
    } else {
      // Handle loss
      const newScore = Math.max(0, score - Math.abs(result.profit));
      setScore(newScore);
      updateScoreWithAnimation(newScore);
      
      // Play lose sound
      if (loseSoundRef.current) {
        loseSoundRef.current.currentTime = 0;
        loseSoundRef.current.play().catch(console.error);
      }
    }

    // Reset betting states after a delay
    setTimeout(() => {
      console.log('Resetting bet states');
      setShowWinMessage(false);
      setBetResult(null);
      setIsBetting(false);
      setCurrentBet(null);
      setTimer(null);  // Reset timer to null when bet completes
    }, 3000);
  };

  const addWinningCoins = (targetRect: DOMRect) => {
    // Position coin at 80% of viewport height (a bit higher)
    const startY = window.innerHeight * 0.80;  // Changed from 0.85 to 0.80
    const startX = window.innerWidth / 2;

    const newCoin: CoinAnimation = {
      id: Date.now() + Math.random(),
      startX,
      startY,
      endX: targetRect.left + targetRect.width / 2,
      endY: targetRect.top + targetRect.height / 2
    };

    console.log('Coin position:', { startY, startX });

    setWinningCoins(prev => [...prev, newCoin]);

    setTimeout(() => {
      setWinningCoins(prev => prev.filter(coin => coin.id !== newCoin.id));
    }, 1000);
  };

  // Update the checkBetStatus function
  const checkBetStatus = async (betId: string) => {
    if (isCheckingStatus) return;

    try {
      setIsCheckingStatus(true);
      console.log('Checking bet status for:', betId);
      
      const response = await fetch(`${API_URL}/api/bet/${betId}`);
      if (!response.ok) throw new Error('Failed to check bet status');
      
      const data: BetStatusResponse = await response.json();
      console.log('Got bet status:', data);
      
      if (data.status === 'completed') {
        setIsCheckingStatus(false);
        if (data.result) {
          // If we have a result, handle it
          handleBetComplete(data.result);
        } else {
          // If completed but no result, reset all betting states
          console.log('Bet completed with no result, resetting states');
          setIsBetting(false);
          setCurrentBet(null);
          setShowWinMessage(false);
          setBetResult(null);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          if (statusCheckTimeoutRef.current) {
            clearTimeout(statusCheckTimeoutRef.current);
            statusCheckTimeoutRef.current = null;
          }
          return; // Stop checking this bet
        }
      } else {
        // If not completed, schedule next check
        setIsCheckingStatus(false);
        statusCheckTimeoutRef.current = setTimeout(() => {
          checkBetStatus(betId);
        }, 500);
      }
    } catch (error) {
      console.error('Error checking bet status:', error);
      // Reset all states on error
      setIsCheckingStatus(false);
      setIsBetting(false);
      setCurrentBet(null);
      setShowWinMessage(false);
      setBetResult(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (statusCheckTimeoutRef.current) {
        clearTimeout(statusCheckTimeoutRef.current);
        statusCheckTimeoutRef.current = null;
      }
    }
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
              {prices.length > 0 ? formatCurrency(prices[prices.length - 1].price, currency) : '-'}
            </BitcoinPrice>
            <Line data={chartData as any} options={chartOptions as any} />
          </div>

          {gameStarted && (
            <>
              <GameStats ref={gameStatsRef}>
                <div style={{ color: '#2e7d32' }}>
                  <span>Player: </span>
                  {username}
                </div>
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

              {/* Move settings button inside gameStarted condition */}
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
                onClick={() => setShowSettings(true)}
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

              {/* Win/Lose Message Container - Same position as bet box */}
              {(showWinMessage || timer === 0) && (
                <div style={{
                  position: 'fixed',
                  bottom: '40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 'auto',
                  height: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 1001,
                  padding: '15px',
                  border: '4px solid white',
                  borderImage: 'linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.4) 20%, rgba(255, 255, 255, 0.4) 80%, transparent 100%) 1',
                  background: 'rgba(0, 0, 0, 0.2)',
                  minWidth: '300px'
                }}>
                  <div style={{
                    color: lastWasWin ? '#f44336' : '#4CAF50',
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '24px',
                    textAlign: 'center',
                    textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                    animation: 'winMessagePopup 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    padding: '15px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '8px',
                    border: `2px solid ${lastWasWin ? '#f44336' : '#4CAF50'}`,
                    whiteSpace: 'nowrap'
                  }}>
                    {lastWasWin ? 'KEEP TRYING!' : 'YOU WIN!'}
                  </div>
                </div>
              )}

              {/* Betting UI Container */}
              <div 
                ref={betBoxRef}
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
                  display: (showWinMessage || timer === 0) ? 'none' : 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{
                  color: '#fff5d4',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '16px',
                  marginBottom: '15px',
                  textAlign: 'center',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.5)'
                }}>
                  {isBetting ? (
                    <>
                      <div style={{
                        color: '#fff5d4',
                        fontFamily: "'Press Start 2P', cursive",
                        fontSize: '12px',
                        textAlign: 'center',
                        marginBottom: '10px'
                      }}>
                        Your bet: {currentBet === 'up' ? '🟢 UP' : '🔴 DOWN'}<br/>
                        Price: ${betPrice?.toFixed(2)}
                      </div>
                      <div style={{
                        color: getTimerColor(timer || 0),
                        fontFamily: "'Press Start 2P', cursive",
                        fontSize: '24px',
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
                )}
              </div>

              {/* Add the coin animations */}
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

          {/* Settings Dialog */}
          {showSettings && (
            <LeaderboardDialog>
              <CloseButton onClick={() => setShowSettings(false)}>×</CloseButton>
              <h2>SETTINGS</h2>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                padding: '20px 0',
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  <span style={{
                    color: '#ffd700',
                    fontSize: '0.9em',
                    marginBottom: '5px',
                  }}>
                    CURRENCY
                  </span>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'center',
                  }}>
                    {['USD', 'EUR', 'GBP'].map((curr) => (
                      <button
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        style={{
                          padding: '8px 16px',
                          background: currency === curr ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                          border: `2px solid ${currency === curr ? '#ffd700' : 'rgba(255, 215, 0, 0.3)'}`,
                          borderRadius: '4px',
                          color: currency === curr ? '#ffd700' : '#fff',
                          cursor: 'pointer',
                          fontFamily: "'Press Start 2P', cursive",
                          fontSize: '0.8em',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (currency !== curr) {
                            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currency !== curr) {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                          }
                        }}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  alignItems: 'center',
                  marginTop: '20px',
                }}>
                  <button
                    onClick={handleResetScore}
                    style={{
                      padding: '10px 20px',
                      background: 'rgba(220, 53, 69, 0.2)',
                      border: '2px solid #dc3545',
                      borderRadius: '4px',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontFamily: "'Press Start 2P', cursive",
                      fontSize: '0.8em',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(220, 53, 69, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(220, 53, 69, 0.2)';
                    }}
                  >
                    RESET SCORE
                  </button>
                </div>
              </div>
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
            onClick={() => setIsMusicPlaying(!isMusicPlaying)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.15)';
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