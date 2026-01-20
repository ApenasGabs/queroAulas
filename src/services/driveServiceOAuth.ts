export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  modifiedTime?: string;
}

/**
 * Extracts folder ID from Google Drive URL or returns the ID if input is already an ID
 * Handles formats like:
 * - https://drive.google.com/drive/folders/1v2dvoHpj_Mik6Fh0EXyGMuBwskHOv5w1
 * - 1v2dvoHpj_Mik6Fh0EXyGMuBwskHOv5w1
 */
export const extractFolderIdFromUrl = (input: string): string | null => {
  // Try to match Google Drive URL pattern
  const urlMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // If input looks like a folder ID (alphanumeric with dashes/underscores)
  if (/^[a-zA-Z0-9_-]+$/.test(input) && input.length > 10) {
    return input;
  }

  return null;
};

/**
 * Lista o conteúdo de uma pasta do Google Drive usando access token
 */
export const listFolderContents = async (
  folderId: string,
  accessToken: string
): Promise<DriveFile[]> => {
  try {
    const query = encodeURIComponent(
      `'${folderId}' in parents and trashed = false`
    );
    const fields = encodeURIComponent(
      "files(id, name, mimeType, webViewLink, webContentLink, size, modifiedTime)"
    );

    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=folder,name&pageSize=1000`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[driveService] API error", error);
      throw new Error(error.error?.message || "Erro ao listar pasta");
    }

    const data = (await response.json()) as { files: DriveFile[] };
    return (data.files || [])
      .filter((file) => file.id && file.name && file.mimeType)
      .map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        size: file.size,
        modifiedTime: file.modifiedTime,
      }));
  } catch (error) {
    console.error("[driveService] Error listing folder contents:", error);
    throw new Error("Erro ao listar conteúdo da pasta");
  }
};

/**
 * Verifica se um arquivo é uma pasta
 */
export const isFolder = (file: DriveFile): boolean => {
  return file.mimeType === "application/vnd.google-apps.folder";
};

/**
 * Verifica se um arquivo é um vídeo
 */
export const isVideo = (file: DriveFile): boolean => {
  const videoMimeTypes = [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/webm",
    "video/MP2T",
    "video/mp2t",
  ];

  const videoExtensions = [
    ".mp4",
    ".avi",
    ".mov",
    ".mkv",
    ".webm",
    ".ts",
    ".m3u8",
  ];

  return (
    videoMimeTypes.includes(file.mimeType) ||
    videoExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  );
};

/**
 * Extrai o ID de uma pasta a partir de um link ou retorna o ID diretamente
 */
export const extractFolderId = (input: string): string => {
  const trimmed = input.trim();

  if (!trimmed.includes("/") && !trimmed.includes("?")) {
    return trimmed;
  }

  const patterns = [/\/folders\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return trimmed;
};
