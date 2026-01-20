import React, { useState } from "react";
import {
  extractFolderIdFromUrl,
  isFolder,
  isVideo,
  listFolderContents,
} from "../services/apiService";
import "./FolderListingOAuth.css";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
}

interface FolderListingOAuthProps {
  accessToken: string | null;
  userEmail?: string;
}

export const FolderListingOAuth: React.FC<FolderListingOAuthProps> = ({
  accessToken,
  userEmail,
}) => {
  const [input, setInput] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoadFolder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setError("Por favor, insira um link ou ID da pasta");
      return;
    }

    setIsLoading(true);
    setError("");
    setFiles([]);

    try {
      // Extract folder ID from input (handle both URLs and plain IDs)
      const id = extractFolderIdFromUrl(input.trim());

      if (!id) {
        setError(
          "ID de pasta inválido. Use um link do Google Drive ou um ID válido.",
        );
        return;
      }

      if (!accessToken) {
        setError("Token de acesso não disponível. Faça login novamente.");
        return;
      }

      setFolderId(id);

      // Load files using access token (real OAuth token)
      const fileList = await listFolderContents(id, accessToken);
      setFiles(fileList);
      console.log("[FolderListingOAuth] loaded files", fileList);
    } catch (err) {
      const error = err as Error;
      console.error("[FolderListingOAuth] Error:", err);
      setError(error.message || "Erro ao carregar pasta");
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
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

  const folders = files.filter(isFolder);
  const videos = files.filter(isVideo);
  const others = files.filter((f) => !isFolder(f) && !isVideo(f));

  return (
    <div className="folder-listing-container">
      <div className="user-info-bar">
        <span className="user-badge">👤 {userEmail}</span>
      </div>

      <form className="folder-form" onSubmit={handleLoadFolder}>
        <div className="form-group">
          <input
            type="text"
            className={`folder-input ${error ? "error" : ""}`}
            placeholder="Cole o link ou ID da pasta do Google Drive..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <>
                <div className="spinner-small"></div>
                Carregando...
              </>
            ) : (
              "Carregar Pasta"
            )}
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </form>

      {folderId && (
        <div className="files-section">
          <div className="section-header">
            <h2>Conteúdo da Pasta</h2>
            <span className="file-count">
              {folders.length} pasta{folders.length !== 1 ? "s" : ""} •
              {videos.length} vídeo{videos.length !== 1 ? "s" : ""}
              {others.length > 0 &&
                ` • ${others.length} outro${others.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {files.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>Nenhum arquivo encontrado nesta pasta</p>
            </div>
          ) : (
            <div className="files-list">
              {folders.length > 0 && (
                <div className="file-group">
                  <h3>📁 Pastas ({folders.length})</h3>
                  <ul>
                    {folders.map((file) => (
                      <li key={file.id} className="file-item folder">
                        <span className="file-icon">📁</span>
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          <span className="file-type">{getFileType(file)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {videos.length > 0 && (
                <div className="file-group">
                  <h3>🎥 Vídeos ({videos.length})</h3>
                  <ul>
                    {videos.map((file) => (
                      <li key={file.id} className="file-item video">
                        <span className="file-icon">🎥</span>
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          <span className="file-type">
                            {getFileType(file)}
                            {file.size && ` • ${formatFileSize(file.size)}`}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {others.length > 0 && (
                <div className="file-group">
                  <h3>📄 Outros ({others.length})</h3>
                  <ul>
                    {others.map((file) => (
                      <li key={file.id} className="file-item other">
                        <span className="file-icon">📄</span>
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          <span className="file-type">
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
          )}
        </div>
      )}
    </div>
  );
};
