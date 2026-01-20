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
 * Lista o conteúdo de uma pasta do Google Drive
 */
export const listFolderContents = async (
  folderId: string
): Promise<DriveFile[]> => {
  try {
    const response = await gapi.client.drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "files(id, name, mimeType, webViewLink, webContentLink, size, modifiedTime)",
      orderBy: "folder,name",
      pageSize: 1000,
    });

    return (response.result.files || [])
      .filter((file) => file.id && file.name && file.mimeType)
      .map((file) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        size: file.size,
        modifiedTime: file.modifiedTime,
      }));
  } catch (error) {
    console.error("Error listing folder contents:", error);
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
    "video/MP2T", // .ts files
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
 * Aceita formatos:
 * - https://drive.google.com/drive/folders/ABC123
 * - https://drive.google.com/drive/u/0/folders/ABC123
 * - ABC123
 */
export const extractFolderId = (input: string): string => {
  const trimmed = input.trim();

  // Se já é um ID (sem caracteres especiais de URL)
  if (!trimmed.includes("/") && !trimmed.includes("?")) {
    return trimmed;
  }

  // Regex para extrair ID de URLs do Google Drive
  const patterns = [/\/folders\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Se não encontrou nenhum padrão, retorna o input original
  return trimmed;
};

/**
 * Obtém informações de um arquivo/pasta específico
 */
export const getFileInfo = async (fileId: string): Promise<DriveFile> => {
  try {
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      fields:
        "id, name, mimeType, webViewLink, webContentLink, size, modifiedTime",
    });

    return response.result as DriveFile;
  } catch (error) {
    console.error("Error getting file info:", error);
    throw new Error("Erro ao obter informações do arquivo");
  }
};
