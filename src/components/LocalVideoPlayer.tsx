import React, { useEffect, useRef, useState } from "react";
import "./LocalVideoPlayer.css";

interface LocalVideoPlayerProps {
  videoUrl: string;
  videoName: string;
  onClose: () => void;
  onMarkCompleted?: () => void;
  onDelete?: () => void;
}

export const LocalVideoPlayer: React.FC<LocalVideoPlayerProps> = ({
  videoUrl,
  videoName,
  onClose,
  onMarkCompleted,
  onDelete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.code === "Space" && videoRef.current) {
        e.preventDefault();
        if (videoRef.current.paused) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleMarkCompleted = () => {
    onMarkCompleted?.();
    onClose();
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="local-player-overlay">
      <div className="local-player-container">
        <div className="local-player-header">
          <h3 className="local-video-title">{videoName}</h3>
          <span className="local-video-source">📱 Cache Local</span>
          <div className="local-header-actions">
            {onMarkCompleted && (
              <button
                className="mark-completed-btn"
                onClick={handleMarkCompleted}
                title="Marcar como concluído"
              >
                ✓ Concluído
              </button>
            )}
            {onDelete && (
              <button
                className="delete-cache-btn"
                onClick={onDelete}
                title="Deletar do cache"
              >
                🗑️ Deletar
              </button>
            )}
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="local-video-wrapper">
          <video
            ref={videoRef}
            src={videoUrl}
            className="local-video-element"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            controls={false}
          />

          <div className="local-video-controls-overlay">
            <button
              className="play-pause-btn"
              onClick={handlePlayPause}
              title={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
          </div>
        </div>

        <div className="local-video-controls">
          <div className="progress-container">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleProgressChange}
              className="progress-bar"
            />
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span> / </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="controls-bottom">
            <div className="volume-control">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>

            <div className="keyboard-hint">
              <kbd>ESC</kbd> Fechar | <kbd>SPACE</kbd> Play/Pause
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
