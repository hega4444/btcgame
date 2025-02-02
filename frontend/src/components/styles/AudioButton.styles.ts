import styled from 'styled-components';

interface AudioButtonContainerProps {
  isMobile: boolean;
}

export const AudioButtonContainer = styled.div<AudioButtonContainerProps>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  cursor: pointer;
  padding: 10px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: ${props => props.isMobile ? '50%' : '20px'};
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Press Start 2P', cursive;
  font-size: 16px;
  color: #fff;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.3);
    transform: scale(1.05);
  }

  span.audio-text {
    font-size: 12px;
    opacity: 0.7;
    display: ${props => props.isMobile ? 'none' : 'inline'};
  }
`; 