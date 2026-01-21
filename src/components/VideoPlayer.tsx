import React, { useState } from "react";
import "./VideoPlayer.css";

interface VideoPlayerProps {
  fileId: string;
  videoName: string;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  fileId,
  videoName,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Google Drive embed URL
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="video-player-overlay"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="video-player-container">
        <div className="video-player-header">
          <h3 className="video-title">{videoName}</h3>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {isLoading && (
          <div className="video-loading">
            <div className="spinner"></div>
            <p>Carregando vídeo...</p>
          </div>
        )}

        <iframe
          src={embedUrl}
          className="video-iframe"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          title={videoName}
        />

        <div className="video-controls-info">
          <p className="video-hint">
            Pressione <kbd>ESC</kbd> para fechar
          </p>
        </div>
      </div>
    </div>
  );
};
