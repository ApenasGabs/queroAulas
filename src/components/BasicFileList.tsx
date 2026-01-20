import React, { useEffect, useState } from "react";
import {
  type DriveFile,
  isFolder,
  isVideo,
  listFolderContents,
} from "../services/driveService";
import "./BasicFileList.css";

interface BasicFileListProps {
  folderId: string;
}

export const BasicFileList: React.FC<BasicFileListProps> = ({ folderId }) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      setError("");

      try {
        const fileList = await listFolderContents(folderId);
        setFiles(fileList);
      } catch (err) {
        const error = err as Error;
        console.error("Error loading files:", err);
        setError(error.message || "Erro ao carregar arquivos");
      } finally {
        setIsLoading(false);
      }
    };

    if (folderId) {
      loadFiles();
    }
  }, [folderId]);

  const getFileIcon = (file: DriveFile): string => {
    if (isFolder(file)) return "📁";
    if (isVideo(file)) return "🎥";
    return "📄";
  };

  const formatFileSize = (bytes?: string): string => {
    if (!bytes) return "";
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileType = (file: DriveFile): string => {
    if (isFolder(file)) return "Pasta";
    if (isVideo(file)) return "Vídeo";
    return "Arquivo";
  };

  if (isLoading) {
    return (
      <div className="file-list-loading">
        <div className="spinner-large"></div>
        <p>Carregando arquivos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-list-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="file-list-empty">
        <span className="empty-icon">📭</span>
        <p>Nenhum arquivo encontrado nesta pasta</p>
      </div>
    );
  }

  // Separar pastas e arquivos
  const folders = files.filter(isFolder);
  const videos = files.filter(isVideo);
  const others = files.filter((f) => !isFolder(f) && !isVideo(f));

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h2>Conteúdo da Pasta</h2>
        <span className="file-count">
          {folders.length} pasta{folders.length !== 1 ? "s" : ""} •
          {videos.length} vídeo{videos.length !== 1 ? "s" : ""}
          {others.length > 0 &&
            ` • ${others.length} outro${others.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="file-list">
        {/* Pastas primeiro */}
        {folders.length > 0 && (
          <div className="file-section">
            <h3 className="section-title">📁 Pastas ({folders.length})</h3>
            <ul className="file-items">
              {folders.map((file) => (
                <li key={file.id} className="file-item folder">
                  <span className="file-icon">{getFileIcon(file)}</span>
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-meta">{getFileType(file)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vídeos */}
        {videos.length > 0 && (
          <div className="file-section">
            <h3 className="section-title">🎥 Vídeos ({videos.length})</h3>
            <ul className="file-items">
              {videos.map((file) => (
                <li key={file.id} className="file-item video">
                  <span className="file-icon">{getFileIcon(file)}</span>
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-meta">
                      {getFileType(file)}
                      {file.size && ` • ${formatFileSize(file.size)}`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Outros arquivos */}
        {others.length > 0 && (
          <div className="file-section">
            <h3 className="section-title">📄 Outros ({others.length})</h3>
            <ul className="file-items">
              {others.map((file) => (
                <li key={file.id} className="file-item other">
                  <span className="file-icon">{getFileIcon(file)}</span>
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-meta">
                      {file.mimeType}
                      {file.size && ` • ${formatFileSize(file.size)}`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
