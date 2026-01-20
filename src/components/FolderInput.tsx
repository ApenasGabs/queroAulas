import React, { useState } from "react";
import { extractFolderId } from "../services/driveService";
import "./FolderInput.css";

interface FolderInputProps {
  onFolderLoad: (folderId: string) => void;
  isLoading?: boolean;
}

export const FolderInput: React.FC<FolderInputProps> = ({
  onFolderLoad,
  isLoading,
}) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setError("Por favor, insira um link ou ID da pasta");
      return;
    }

    try {
      const folderId = extractFolderId(input);

      if (!folderId) {
        setError("Link ou ID inválido");
        return;
      }

      setError("");
      onFolderLoad(folderId);
    } catch {
      setError("Erro ao processar o link");
    }
  };

  return (
    <form className="folder-input-form" onSubmit={handleSubmit}>
      <div className="folder-input-container">
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
          className="folder-submit-button"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <>
              <div className="spinner-small"></div>
              Carregando...
            </>
          ) : (
            "Carregar Curso"
          )}
        </button>
      </div>

      {error && <p className="folder-input-error">{error}</p>}

      <p className="folder-input-hint">
        💡 Aceita links como: https://drive.google.com/drive/folders/ABC123 ou
        apenas o ID
      </p>
    </form>
  );
};
