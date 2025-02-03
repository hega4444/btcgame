import * as React from 'react';
import { AudioButtonContainer } from './styles/AudioButton.styles';

interface AudioButtonProps {
  isMobile: boolean;
  isMusicPlaying: boolean;
  onClick: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  isMobile,
  isMusicPlaying,
  onClick,
  audioRef
}) => {
  // Handle visibility change
  React.useEffect(() => {
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
  }, [isMusicPlaying, audioRef]);

  // Handle music playing state changes
  React.useEffect(() => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.play().catch(err => console.log('Play on state change failed:', err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMusicPlaying, audioRef]);

  return (
    <AudioButtonContainer
      isMobile={isMobile}
      onClick={onClick}
    >
      <span>{isMusicPlaying ? '🔊' : '🔈'}</span>
      {!isMobile && (
        <span className="audio-text">
          AUDIO {isMusicPlaying ? 'ON' : 'OFF'}
        </span>
      )}
    </AudioButtonContainer>
  );
}; 