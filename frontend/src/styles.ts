import styled, { keyframes } from 'styled-components';

export const panBackground = keyframes`
  0% {
    background-position: 0 center;
  }
  49.99% {
    background-position: -100% center;
  }
  50% {
    background-position: -100% center;
  }
  99.99% {
    background-position: 0 center;
  }
  100% {
    background-position: 0 center;
  }
`;

export const lightBeam = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

export const glowText = keyframes`
  0%, 100% {
    text-shadow: 0 0 12px rgba(255, 215, 0, 0.6),
                 0 0 30px rgba(255, 215, 0, 0.4),
                 0 0 50px rgba(255, 215, 0, 0.3);
  }
  50% {
    text-shadow: 0 0 16px rgba(255, 215, 0, 0.8),
                 0 0 38px rgba(255, 215, 0, 0.6),
                 0 0 60px rgba(255, 215, 0, 0.4);
  }
`;

export const sequentialZoom = keyframes`
  0%, 100% { transform: scale(1); }
  5% { transform: scale(1.2); }
  10% { transform: scale(1); }
`;

export const pulseGlow = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5),
                0 0 40px rgba(255, 215, 0, 0.3);
  }
`;

export const spinCoin = keyframes`
  0% { background-image: url('/assets/coin1.png'); }
  25% { background-image: url('/assets/coin2.png'); }
  50% { background-image: url('/assets/coin3.png'); }
  75% { background-image: url('/assets/coin4.png'); }
  100% { background-image: url('/assets/coin1.png'); }
`;

export const moveCoin = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.3) rotate(360deg);
    opacity: 0;
  }
`;

export const float = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
`;

export const floatBubble = keyframes`
  0% {
    bottom: -100px;
    opacity: 0;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    bottom: 100vh;
    opacity: 0;
  }
`;

export const wobble = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  33% {
    transform: translateX(-5px);
  }
  66% {
    transform: translateX(5px);
  }
`;

export const Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3px;
  overflow: hidden;
  background-color: rgb(20, 16, 36);
  position: relative;
`;

export const Box = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: 
    linear-gradient(rgba(0, 0, 40, 0.3), rgba(0, 0, 40, 0.3)),
    url('/assets/underwater_backgrounds.svg');
  background-size: auto 100%;
  background-position: 0 center;
  background-repeat: repeat-x;
  background-blend-mode: multiply;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 
              0 1px 3px rgba(0, 0, 0, 0.08);
  animation: ${panBackground} 60s linear infinite;
  will-change: background-position;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: clamp(1.5rem, 4vh, 3rem);
  padding: clamp(1rem, 3vw, 2rem);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 45%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.1) 55%,
      transparent 100%
    );
    animation: ${lightBeam} 8s linear infinite;
    pointer-events: none;
    border-radius: inherit;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.25) 0%,
      transparent 50%
    );
    pointer-events: none;
    border-radius: inherit;
  }
`;

export const Title = styled.div`
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(2.45rem, 5vw, 4rem);
  color: #FFD700;
  text-transform: uppercase;
  text-align: center;
  z-index: 1;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(0.5rem, 2vh, 1rem);
  -webkit-text-stroke: clamp(1px, 0.15vw, 2px) #B8860B;
`;

export const TitleLine = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.2em;
  flex-wrap: wrap;
  width: 100%;
`;

export const Letter = styled.span<{ delay: number }>`
  display: inline-block;
  animation: 
    ${glowText} 3s ease-in-out infinite,
    ${sequentialZoom} 2s linear infinite;
  animation-delay: ${props => props.delay}s;
`;

export const PlayButton = styled.button`
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(0.8rem, 3vw, 1.5rem);
  padding: clamp(0.5rem, 2vw, 1rem) clamp(1.5rem, 4vw, 3rem);
  border: clamp(2px, 0.3vw, 3px) solid #FFD700;
  background: rgba(0, 0, 0, 0.5);
  color: #FFD700;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  z-index: 1;
  text-transform: uppercase;
  animation: ${pulseGlow} 2s ease-in-out infinite;
  position: relative;
  min-width: min-content;
  max-width: 90vw;

  &:hover {
    background: rgba(255, 215, 0, 0.1);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const CoinContainer = styled.div`
  position: relative;
  left: 0;
  transform: none;
  animation: ${float} 3s ease-in-out infinite;
  filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.4));
`;

export const TopCoinContainer = styled(CoinContainer)`
  animation: ${float} 3s ease-in-out infinite;
  animation-delay: -1.5s;
`;

export const CoinSprite = styled.div`
  width: clamp(64px, 12vw, 96px);
  height: clamp(64px, 12vw, 96px);
  background-image: url('/assets/coin1.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  animation: ${spinCoin} 0.6s steps(1) infinite;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))
         drop-shadow(0 0 20px rgba(255, 215, 0, 0.2));
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
`;

export const TopCoinSprite = styled(CoinSprite)`
  animation: ${spinCoin} 0.6s steps(1) infinite;
  animation-delay: -0.3s;
  image-rendering: pixelated;
`;

export const Dialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  padding: 2rem;
  border-radius: 1rem;
  border: 2px solid #ffd700;
  color: white;
  z-index: 1000;
  min-width: 300px;
  position: relative;
`;

export const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;

  h2 {
    color: #ffd700;
    margin: 0;
  }

  p {
    margin: 0;
  }
`;

export const DialogButton = styled(PlayButton)`
  opacity: ${props => props.disabled ? 0.5 : 1};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
`;

export const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #ffd700;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  width: 200px;
  
  &:focus {
    outline: none;
    border-color: #fff;
  }
`;

export const GameContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #ffd700;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.1);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const BubbleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

export const Bubble = styled.div<{ 
  size: number; 
  duration: number; 
  delay: number; 
  left: number;
}>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  left: ${props => props.left}%;
  bottom: -100px;
  animation: 
    ${floatBubble} ${props => props.duration}s linear infinite,
    ${wobble} 3s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
  pointer-events: none;
  z-index: 2;
  
  &::before {
    content: '';
    position: absolute;
    top: 15%;
    left: 15%;
    width: 30%;
    height: 30%;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    transform: rotate(-45deg);
  }
`;

export const GameStats = styled.div`
  position: fixed;
  top: 20px;
  left: 20px;
  color: rgb(97, 150, 29);
  font-family: 'Press Start 2P', cursive;
  font-size: 1.1em;
  z-index: 100;
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.5),
    0 0 10px rgba(0, 191, 255, 0.5);
  display: flex;
  flex-direction: column;
  gap: 15px;

  div {
    text-transform: uppercase;
    animation: ${glowText} 3s ease-in-out infinite;
    text-shadow: 
      0 0 12px rgba(0, 191, 255, 0.6),
      0 0 20px rgba(0, 191, 255, 0.4);
  }
`;

export const TopButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  color: rgb(97, 150, 29);
  font-family: 'Press Start 2P', cursive;
  font-size: 1.1em;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 100;
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.5),
    0 0 10px rgba(0, 191, 255, 0.5);
  text-transform: uppercase;
  animation: ${glowText} 3s ease-in-out infinite;
  
  &:hover {
    transform: scale(1.05);
  }
`;

export const BitcoinPrice = styled.div`
  position: fixed;
  top: 60px;
  right: 20px;
  color: #0d47a1; // Darker blue-green color
  font-family: 'Press Start 2P', cursive;
  font-size: 1.2em;
  z-index: 100;
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.5),
    0 0 10px rgba(13, 71, 161, 0.5); // Matching glow
  text-transform: uppercase;
  animation: ${glowText} 3s ease-in-out infinite;
  display: flex;
  align-items: center;
  gap: 8px;

  img {
    width: 24px;
    height: 24px;
  }
`;

export const LeaderboardDialog = styled(Dialog)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(20, 30, 45, 0.95);
  padding: 20px;
  z-index: 1000;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  width: 90vw;
  max-width: 400px;
  font-family: 'Press Start 2P', cursive;

  h2 {
    color: #FFD700;
    margin-top: 0;
    font-size: 1.4em;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    text-align: center;
  }
`;

export const LeaderboardItem = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 80px;
  gap: 10px;
  color: rgb(97, 150, 29);
  font-family: 'Press Start 2P', cursive;
  font-size: 0.9em;
  padding: 8px 0;
  border-bottom: 1px solid rgba(97, 150, 29, 0.3);
  
  &:last-child {
    border-bottom: none;
  }

  span:last-child {
    text-align: right;
  }
`;

interface CoinAnimationProps {
  $startX: number;
  $startY: number;
}

export const CoinAnimationContainer = styled.div<CoinAnimationProps>`
  position: fixed;
  left: ${props => props.$startX}px;
  top: ${props => props.$startY}px;
  transform: translate(-50%, -50%);
  z-index: 1000;
  animation: ${moveCoin} 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: none;
`;