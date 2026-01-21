import React, { useMemo, useState } from "react";
import { useVideoProgress } from "../hooks/useVideoProgress";
import type { DriveNode } from "../services/apiService";
import {
  extractFolderIdFromUrl,
  isFolder,
  isVideo,
  listFolderTree,
} from "../services/apiService";
import "./FolderListingOAuth.css";
import { VideoPlayer } from "./VideoPlayer";

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
  const [tree, setTree] = useState<DriveNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<DriveNode | null>(null);

  const { markInProgress, markCompleted, getVideoProgress } =
    useVideoProgress(userEmail);

  const handleLoadFolder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setError("Por favor, insira um link ou ID da pasta");
      return;
    }

    setIsLoading(true);
    setError("");
    setTree([]);

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

      const fileTree = await listFolderTree(id, accessToken);
      setTree(fileTree);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Erro ao carregar pasta");
      setTree([]);
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

  const getFileType = (file: DriveNode): string => {
    if (isFolder(file)) return "Pasta";
    if (isVideo(file)) return "Vídeo";
    return "Arquivo";
  };

  const counts = useMemo(() => {
    const recurse = (nodes: DriveNode[]) =>
      nodes.reduce(
        (acc, node) => {
          if (isFolder(node)) acc.folders += 1;
          else if (isVideo(node)) acc.videos += 1;
          else acc.others += 1;
          if (node.children?.length) {
            const nested = recurse(node.children);
            acc.folders += nested.folders;
            acc.videos += nested.videos;
            acc.others += nested.others;
          }
          return acc;
        },
        { folders: 0, videos: 0, others: 0 },
      );
    return recurse(tree);
  }, [tree]);

  const renderTree = (nodes: DriveNode[], depth = 0) => {
    return (
      <ul className="tree-list">
        {nodes.map((node) => {
          const progress = getVideoProgress(node.id);
          const isCompleted = progress?.status === "completed";

          return (
            <li key={node.id} className={`tree-item depth-${depth}`}>
              <div
                className={`file-item-row ${isVideo(node) ? "clickable" : ""}`}
                onClick={() => {
                  if (isVideo(node)) {
                    markInProgress(node.id, node.name, folderId);
                    setSelectedVideo(node);
                  }
                }}
              >
                <span className="file-icon">
                  {isCompleted
                    ? "✅"
                    : isFolder(node)
                      ? "📁"
                      : isVideo(node)
                        ? "🎥"
                        : "📄"}
                </span>
                <div className="file-info">
                  <span
                    className={`file-name ${isCompleted ? "completed" : ""}`}
                  >
                    {node.name}
                  </span>
                  <span className="file-type">
                    {getFileType(node)}
                    {node.size &&
                      !isFolder(node) &&
                      ` • ${formatFileSize(node.size)}`}
                  </span>
                </div>
              </div>
              {node.children &&
                node.children.length > 0 &&
                renderTree(node.children, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

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
              {counts.folders} pasta{counts.folders !== 1 ? "s" : ""} •
              {counts.videos} vídeo{counts.videos !== 1 ? "s" : ""}
              {counts.others > 0 &&
                ` • ${counts.others} outro${counts.others !== 1 ? "s" : ""}`}
            </span>
          </div>

          {tree.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>Nenhum arquivo encontrado nesta pasta</p>
            </div>
          ) : (
            <div className="files-list tree-view">{renderTree(tree)}</div>
          )}
        </div>
      )}

      {selectedVideo && (
        <VideoPlayer
          fileId={selectedVideo.id}
          videoName={selectedVideo.name}
          onClose={() => setSelectedVideo(null)}
          onMarkCompleted={() => {
            markCompleted(selectedVideo.id, selectedVideo.name, folderId);
          }}
        />
      )}
    </div>
  );
};
