import styled, { keyframes, css } from 'styled-components';

const spin = keyframes`
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
`;

const moveCoin = (startX: number, startY: number, endX: number, endY: number) => keyframes`
  0% {
    left: ${startX}px;
    top: ${startY}px;
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  50% {
    left: ${(startX + endX) / 2}px;
    top: ${Math.min(startY, endY) - 200}px;
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 1;
  }
  100% {
    left: ${endX}px;
    top: ${endY}px;
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0;
  }
`;

export const WinningCoin = styled.div<{ startX: number; startY: number; endX: number; endY: number }>`
  position: fixed;
  width: 40px;
  height: 40px;
  pointer-events: none;
  z-index: 1000;
  font-size: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '🪙';
    display: block;
  }
  
  ${props => css`
    animation: 
      ${moveCoin(props.startX, props.startY, props.endX, props.endY)} 2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
      ${spin} 1s linear infinite;
  `}
`; 