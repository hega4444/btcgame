import * as React from 'react';
import { AudioButtonContainer } from './styles/AudioButton.styles';

interface AudioButtonProps {
  isMobile: boolean;
  isMusicPlaying: boolean;
  onClick: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

/**
 * Audio Button Component
 * 
 * Controls game audio playback and provides visual feedback.
 * Manages audio state and handles browser autoplay restrictions.
 * 
 * Features:
 * - Audio toggle control
 * - Visual state indication
 * - Responsive design
 * - Browser visibility handling
 * 
 * Props:
 * - isMobile: Responsive layout flag
 * - isMusicPlaying: Audio playback state
 * - onClick: Toggle callback
 * - audioRef: Reference to audio element
 */

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
      $isMobile={isMobile}
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