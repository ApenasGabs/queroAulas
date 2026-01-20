/**
 * API Service - Communicates with backend proxy
 *
 * Em desenvolvimento: usa proxy do Vite (/api -> localhost:3000)
 * Em produção: chama /api diretamente (Vercel roteia)
 */

const API_URL = "/api";

interface AuthTokens {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

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

/**
 * Verify ID token (via backend) - Usado para auth-code flow no futuro
 * Por enquanto, usamos implicit flow que obtém access_token diretamente
 */
export const verifyToken = async (token: string): Promise<UserInfo> => {
  const response = await fetch(`${API_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Token verification failed");
  }

  const data = await response.json();
  return data.user;
};

/**
 * Revoke access token (via backend)
 */
export const revokeToken = async (token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to revoke token");
  }
};

/**
 * Refresh access token (via backend)
 */
export const refreshAccessToken = async (
  refreshToken: string,
): Promise<AuthTokens> => {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to refresh token");
  }

  const data = await response.json();
  return data.tokens;
};

/**
 * List folder contents from Google Drive (via backend proxy)
 */
export const listFolderContents = async (
  folderId: string,
  accessToken: string,
): Promise<DriveFile[]> => {
  const response = await fetch(`${API_URL}/drive/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ folderId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to list folder contents");
  }

  const data = await response.json();
  return data.files;
};

/**
 * Get file metadata from Google Drive (via backend proxy)
 */
export const getFileMetadata = async (
  fileId: string,
  accessToken: string,
): Promise<DriveFile> => {
  const response = await fetch(`${API_URL}/drive/file/${fileId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get file metadata");
  }

  return response.json();
};

/**
 * Extract folder ID from Google Drive URL
 */
export const extractFolderIdFromUrl = (input: string): string | null => {
  const urlMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  if (/^[a-zA-Z0-9_-]+$/.test(input) && input.length > 10) {
    return input;
  }

  return null;
};

/**
 * Check if file is a folder
 */
export const isFolder = (file: DriveFile): boolean => {
  return file.mimeType === "application/vnd.google-apps.folder";
};

/**
 * Check if file is a video
 */
export const isVideo = (file: DriveFile): boolean => {
  const videoMimeTypes = [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/webm",
  ];
  return videoMimeTypes.includes(file.mimeType);
};
