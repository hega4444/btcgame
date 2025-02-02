import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { background-position: 0px; }
  100% { background-position: -120px; }
`;

export const WinningCoin = styled.div<{ startX: number; startY: number; endX: number; endY: number }>`
  position: fixed;
  width: 30px;
  height: 30px;
  background-image: url('/coin-sprite.png');
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
  transform: translate(-50%, -50%);
  
  animation: ${({ startX, startY, endX, endY }) => `
    ${moveCoin(startX, startY, endX, endY)} 1s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    ${spin} 0.3s linear infinite
  `};
`;

const moveCoin = (startX: number, startY: number, endX: number, endY: number) => keyframes`
  0% {
    left: ${startX}px;
    top: ${startY}px;
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    left: ${endX}px;
    top: ${endY}px;
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0;
  }
`; 