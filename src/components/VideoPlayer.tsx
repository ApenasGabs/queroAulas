import React, { useEffect, useState } from "react";
import { useVideoCache } from "../hooks/useVideoCache";
import { LocalVideoPlayer } from "./LocalVideoPlayer";
import "./VideoPlayer.css";

interface VideoPlayerProps {
  fileId: string;
  videoName: string;
  onClose: () => void;
  onMarkCompleted?: () => void;
  accessToken?: string | null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  fileId,
  videoName,
  onClose,
  onMarkCompleted,
  accessToken,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showLocalPlayer, setShowLocalPlayer] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [isIframeError, setIsIframeError] = useState(false);
  const [downloadError, setDownloadError] = useState<string>("");
  const [showDownloadButton, setShowDownloadButton] = useState(false);

  const {
    isDownloading,
    downloadProgress,
    isVideoCached,
    downloadVideo,
    playVideoFromCache,
    deleteCachedVideo,
    loadCachedVideos,
  } = useVideoCache();

  useEffect(() => {
    loadCachedVideos();
  }, [loadCachedVideos]);

  // Timer para mostrar botão de download após 10 segundos
  useEffect(() => {
    if (!isLoading) return; // Se já carregou, cancelar timer

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;

      if (elapsed >= 10) {
        setShowDownloadButton(true);
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [isLoading]);

  // Google Drive embed URL
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  // Verificar se iframe carregou com erro
  const handleIframeError = () => {
    setIsIframeError(true);
    setIsLoading(false);
  };

  // Baixar e reproduzir vídeo do cache
  const handleDownloadAndPlay = async () => {
    try {
      setDownloadError("");

      // Verificar se já está em cache
      if (isVideoCached(fileId)) {
        const url = await playVideoFromCache(fileId);
        if (url) {
          setLocalVideoUrl(url);
          setShowLocalPlayer(true);
          return;
        }
      }

      // Baixar se não estiver em cache
      if (!accessToken) {
        setDownloadError("Token de acesso não disponível");
        return;
      }

      const url = await downloadVideo(fileId, videoName, accessToken);
      setLocalVideoUrl(url);
      setShowLocalPlayer(true);
    } catch (error) {
      console.error("[VideoPlayer] Error downloading video:", error);
      setDownloadError(
        error instanceof Error ? error.message : "Erro ao baixar vídeo",
      );
    }
  };

  // Deletar vídeo do cache
  const handleDeleteCache = async () => {
    try {
      await deleteCachedVideo(fileId);
      setShowLocalPlayer(false);
      setLocalVideoUrl(null);
    } catch (error) {
      console.error("[VideoPlayer] Error deleting cache:", error);
    }
  };

  const handleMarkCompleted = () => {
    onMarkCompleted?.();
    onClose();
  };

  // Se mostrar reprodutor local, renderizar aquele ao invés
  if (showLocalPlayer && localVideoUrl) {
    return (
      <LocalVideoPlayer
        videoUrl={localVideoUrl}
        videoName={videoName}
        onClose={() => {
          setShowLocalPlayer(false);
          onClose();
        }}
        onMarkCompleted={onMarkCompleted}
        onDelete={handleDeleteCache}
      />
    );
  }

  return (
    <div
      className="video-player-overlay"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="video-player-container">
        <div className="video-player-header">
          <h3 className="video-title">{videoName}</h3>
          <div className="header-actions">
            {isDownloading && (
              <div className="download-progress">
                <div className="progress-bar-small">
                  <div
                    className="progress-fill"
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  {Math.round(downloadProgress)}%
                </span>
              </div>
            )}

            {(isIframeError || isVideoCached(fileId) || showDownloadButton) && (
              <button
                className="play-offline-btn"
                onClick={handleDownloadAndPlay}
                disabled={isDownloading}
                title={
                  isVideoCached(fileId)
                    ? "Reproduzir do cache"
                    : "Baixar e reproduzir offline"
                }
              >
                {isVideoCached(fileId) ? "📱 Cache" : "⬇️ Offline"}
              </button>
            )}

            {isIframeError && !isVideoCached(fileId) && (
              <button
                className="download-btn"
                onClick={handleDownloadAndPlay}
                disabled={isDownloading}
                title="Baixar vídeo"
              >
                {isDownloading ? "Baixando..." : "⬇️ Baixar"}
              </button>
            )}

            {onMarkCompleted && (
              <button
                className="mark-completed-btn"
                onClick={handleMarkCompleted}
                title="Marcar como concluído"
              >
                ✓ Concluído
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

        {isLoading && (
          <div className="video-loading">
            <div className="spinner"></div>
            <p>Carregando vídeo...</p>
          </div>
        )}

        {isIframeError ? (
          <div className="iframe-error-message">
            <p>⚠️ Não foi possível carregar o vídeo no iframe</p>
            {downloadError && <p className="error-text">{downloadError}</p>}
            <button onClick={handleDownloadAndPlay} disabled={isDownloading}>
              {isDownloading ? "Baixando..." : "Baixar e Reproduzir Offline"}
            </button>
          </div>
        ) : (
          <iframe
            src={embedUrl}
            className="video-iframe"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            onLoad={() => {
              setIsLoading(false);
              setShowDownloadButton(false);
            }}
            onError={handleIframeError}
            title={videoName}
          />
        )}

        <div className="video-controls-info">
          <p className="video-hint">
            Pressione <kbd>ESC</kbd> para fechar
          </p>
        </div>
      </div>
    </div>
  );
};
