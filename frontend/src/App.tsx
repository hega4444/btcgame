import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Dialog,
  DialogContent,
  DialogButton,
  Input,
  CloseButton,
  LeaderboardDialog,
  LeaderboardItem,
} from './styles';
import './config/chartConfig';
import { mockPrices } from './mockData/bitcoinPrices';
import { GameContainer as StyledGameContainer } from './components/GameContainer';
import {
  dialogStyles,
  dialogTitle,
  dialogText,
  inputContainer,
  inputStyle,
  dialogFooterText,
  acceptButton
} from './components/styles/App.styles';
import { api } from './services/api';
import { AudioButton } from './components/AudioButton';

interface PriceData {
  timestamp: string;
  price: number;
}

// Debug logging for environment variables
console.log('Environment Variables:', {
  VITE_USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_FORGET_USER: import.meta.env.VITE_FORGET_USER,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE
});

// Add this interface near the top with other interfaces
interface LeaderboardEntry {
  username: string;
  score: number;
}

const App: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [username, setUsername] = useState('');
  const [hasAccepted, setHasAccepted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Add new state for audio
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement>(new Audio('/assets/coin_c_02-102844.mp3'));
  const loseSoundRef = useRef<HTMLAudioElement>(new Audio('/assets/violin-lose-4-185125.mp3'));

  // Add this near the top with other state declarations
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Add these new states at the top with other states
  const [showSettings, setShowSettings] = useState(false);
  const [currency, setCurrency] = useState('USD');

  // Replace the mocked leaderboard data with state
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Add state for clientId if not already present
  const [clientId] = useState(() => {
    const saved = localStorage.getItem('btcGameClientId');
    if (saved) return saved;
    
    const newId = crypto.randomUUID();
    localStorage.setItem('btcGameClientId', newId);
    return newId;
  });

  // Add this effect to handle window resizing
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const shouldForgetUser = import.meta.env.VITE_FORGET_USER === 'true';
    
    // If FORGET_USER is true, clear localStorage
    if (shouldForgetUser) {
      localStorage.removeItem('btcGameAccepted');
      localStorage.removeItem('btcGameUsername');
      localStorage.removeItem('btcGameClientId');
      setHasAccepted(false);
      setUsername('');
      return;
    }

    // Just restore the username if available
    const savedUsername = localStorage.getItem('btcGameUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setHasAccepted(true);
    }
  }, []);

  // Update the price fetching function
  const fetchPrices = useCallback(async () => {
    try {
      const newPrices = await api.fetchPrices(currency);
      setPrices(prev => {
        const combined = [...prev, ...newPrices];
        return combined.slice(-12); // Always keep only the last 12 points
      });
    } catch (error) {
      console.error('Error fetching prices:', error);
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
    
    const shouldForgetUser = import.meta.env.VITE_FORGET_USER === 'true';
    const savedClientId = localStorage.getItem('btcGameClientId');
    const savedUsername = localStorage.getItem('btcGameUsername');
    const accepted = localStorage.getItem('btcGameAccepted');

    console.log('Play clicked - checking state:', {
      shouldForgetUser,
      savedClientId,
      savedUsername,
      accepted,
      hasAccepted
    });
    
    // If we have saved credentials and FORGET_USER is false, start game directly
    if (!shouldForgetUser && savedClientId && savedUsername && accepted === 'true') {
      console.log('Starting game with saved credentials');
      setGameStarted(true);
    } else {
      // Otherwise show the dialog
      console.log('Showing dialog for new user registration');
      setShowDialog(true);
      setTimeout(() => {
        usernameInputRef.current?.focus();
      }, 100);
    }
  };

  const handleAccept = async () => {
    if (!username) return;

    try {
      await api.registerUser(username);
      localStorage.setItem('btcGameAccepted', 'true');
      localStorage.setItem('btcGameUsername', username);
      localStorage.setItem('btcGameClientId', clientId);
      setHasAccepted(true);
      setShowDialog(false);
      setGameStarted(true);
    } catch (error) {
      console.error('Error registering user:', error);
      alert('Failed to register user. Please try again.');
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    // Show play button again when dialog is closed with X
    setShowPlayButton(true);
  };

  // Memoize the username change handler
  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  }, []);

  // Add this handler function
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && username.trim()) {
      handleAccept();
    }
  };

  // Update the audio initialization useEffect
  useEffect(() => {
    const initAndPlayAudio = async () => {
      if (!audioRef.current) {
        audioRef.current = new Audio('/assets/little-slimex27s-adventure-151007.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
        audioRef.current.preload = 'auto';
        
        setIsMusicPlaying(true);
        
        try {
          await audioRef.current.play();
          console.log('Audio started playing');
        } catch (error) {
          console.log('Autoplay prevented:', error);
          
          const playOnInteraction = () => {
            if (audioRef.current) {
              audioRef.current.play()
                .then(() => {
                  console.log('Audio started on user interaction');
                  document.removeEventListener('click', playOnInteraction);
                  document.removeEventListener('touchstart', playOnInteraction);
                  document.removeEventListener('keydown', playOnInteraction);
                })
                .catch(err => console.log('Play on interaction failed:', err));
            }
          };

          document.addEventListener('click', playOnInteraction);
          document.addEventListener('touchstart', playOnInteraction);
          document.addEventListener('keydown', playOnInteraction);
        }
      }
    };

    initAndPlayAudio();

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []); // Empty dependency array is fine here as we only want this to run once on mount

  useEffect(() => {
    if (winSoundRef.current) winSoundRef.current.volume = 0.4;
    if (loseSoundRef.current) loseSoundRef.current.volume = 0.3;
  }, []);

  // Update the leaderboard click handler to fetch data
  const handleLeaderboardClick = async () => {
    setShowLeaderboard(true);
    setIsLoadingLeaderboard(true);
    
    try {
      const data = await api.fetchLeaderboard();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Fallback to empty array or show error message
      setLeaderboardData([]);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  return (
    <Container>
      <StyledGameContainer
        prices={prices}
        gameStarted={gameStarted}
        currency={currency}
        username={username}
        setUsername={setUsername}
        isMobile={isMobile}
        showPlayButton={showPlayButton}
        handlePlay={handlePlay}
        isMusicPlaying={isMusicPlaying}
        setIsMusicPlaying={setIsMusicPlaying}
        winSoundRef={winSoundRef}
        loseSoundRef={loseSoundRef}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        setCurrency={setCurrency}
        onLeaderboardClick={handleLeaderboardClick}
        clientId={clientId}
      />
      
      {showDialog && (
        <Dialog style={dialogStyles}>
          <CloseButton onClick={handleClose}>×</CloseButton>
          <DialogContent>
            <h2 style={dialogTitle}>Welcome to Bitcoin Game!</h2>
            <p style={dialogText}>Guess if Bitcoin's price will go up or down in the next minute to win points!</p>
            <div style={inputContainer}>
              <Input
                ref={usernameInputRef}
                type="text"
                placeholder="USERNAME"
                value={username}
                onChange={handleUsernameChange}
                onKeyDown={handleKeyDown}
                style={inputStyle}
              />
            </div>
            <p style={dialogFooterText}>This game uses cookies to save your scores and progress.</p>
            <DialogButton 
              onClick={handleAccept} 
              disabled={!username.trim()}
              style={acceptButton(!username.trim())}
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
          {isLoadingLeaderboard ? (
            <div>Loading...</div>
          ) : leaderboardData.length > 0 ? (
            leaderboardData.map((player, index) => (
              <LeaderboardItem key={index}>
                <span>{index + 1}.</span>
                <span>{player.username}</span>
                <span>{player.score}</span>
              </LeaderboardItem>
            ))
          ) : (
            <div>No leaderboard data available</div>
          )}
        </LeaderboardDialog>
      )}

      <AudioButton 
        isMobile={isMobile}
        isMusicPlaying={isMusicPlaying}
        onClick={() => setIsMusicPlaying(!isMusicPlaying)}
        audioRef={audioRef}
      />
    </Container>
  );
};

export default React.memo(App); 