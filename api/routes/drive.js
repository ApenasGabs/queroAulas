import express from "express";

const router = express.Router();

const FOLDER_ID_REGEX = /^[a-zA-Z0-9_-]{25,50}$/;

const isFolder = (mimeType) =>
  mimeType === "application/vnd.google-apps.folder";

const naturalCompare = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

const sanitizeFile = (file) => ({
  id: file.id,
  name: file.name,
  mimeType: file.mimeType,
  webViewLink: file.webViewLink,
  webContentLink: file.webContentLink,
  thumbnailLink: file.thumbnailLink,
  size: file.size,
  modifiedTime: file.modifiedTime,
});

/**
 * Simple auth middleware to check for access token
 */
const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  req.accessToken = authHeader.substring(7);
  next();
};

/**
 * List folder contents from Google Drive
 * POST /api/drive/list
 */
router.post("/list", authenticateRequest, async (req, res) => {
  try {
    const { folderId } = req.body;

    if (!folderId) {
      return res.status(400).json({ error: "Folder ID is required" });
    }

    if (!FOLDER_ID_REGEX.test(folderId)) {
      return res.status(400).json({ error: "Invalid folder ID format" });
    }

    // Build query
    const query = encodeURIComponent(
      `'${folderId}' in parents and trashed = false`,
    );
    const fields = encodeURIComponent(
      "files(id, name, mimeType, webViewLink, webContentLink, size, modifiedTime, thumbnailLink)",
    );

    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=folder,name&pageSize=1000`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${req.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Drive API Error]", error);

      // Return user-friendly error messages
      const errorMessages = {
        invalid_grant: "Sessão expirada. Faça login novamente.",
        insufficient_permissions: "Sem permissão para acessar esta pasta.",
        not_found: "Pasta não encontrada.",
        rate_limit_exceeded:
          "Muitas requisições. Tente novamente em alguns minutos.",
      };

      const userMessage =
        errorMessages[error.error?.code] ||
        "Erro ao carregar pasta. Tente novamente.";

      return res.status(response.status).json({
        error: userMessage,
        code: error.error?.code,
      });
    }

    const data = await response.json();

    const files = (data.files || [])
      .filter((file) => file.id && file.name && file.mimeType)
      .sort((a, b) => naturalCompare(a.name, b.name))
      .map(sanitizeFile);

    res.json({ files });
  } catch (error) {
    console.error("[Drive List Error]", error);
    res.status(500).json({
      error: "Erro ao listar conteúdo da pasta",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

const listFolderRecursive = async (folderId, accessToken, depth = 0) => {
  const query = encodeURIComponent(
    `'${folderId}' in parents and trashed = false`,
  );
  const fields = encodeURIComponent(
    "files(id, name, mimeType, webViewLink, webContentLink, size, modifiedTime, thumbnailLink)",
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
    const err = new Error(error.error?.message || "Failed to list folder");
    err.code = error.error?.code;
    throw err;
  }

  const data = await response.json();
  const items = (data.files || [])
    .filter((file) => file.id && file.name && file.mimeType)
    .sort((a, b) => naturalCompare(a.name, b.name))
    .map(sanitizeFile);

  const childrenPromises = items.map(async (item) => {
    if (!isFolder(item.mimeType)) return item;
    const nested = await listFolderRecursive(item.id, accessToken, depth + 1);
    return { ...item, children: nested };
  });

  return Promise.all(childrenPromises);
};

router.post("/list-recursive", authenticateRequest, async (req, res) => {
  try {
    const { folderId } = req.body;

    if (!folderId) {
      return res.status(400).json({ error: "Folder ID is required" });
    }

    if (!FOLDER_ID_REGEX.test(folderId)) {
      return res.status(400).json({ error: "Invalid folder ID format" });
    }

    const tree = await listFolderRecursive(folderId, req.accessToken);
    res.json({ tree });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Drive Recursive Error]", error);
    }

    const status = error.code === 404 ? 404 : 500;
    res.status(status).json({
      error:
        error.code === 404
          ? "Pasta não encontrada"
          : "Erro ao listar conteúdo da pasta",
      code: error.code,
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * Get file metadata from Google Drive
 * GET /api/drive/file/:fileId
 */
router.get("/file/:fileId", authenticateRequest, async (req, res) => {
  try {
    const { fileId } = req.params;

    const fields = encodeURIComponent(
      "id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents",
    );

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${fields}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${req.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({
        error: "Erro ao obter arquivo",
        code: error.error?.code,
      });
    }

    const file = await response.json();
    res.json(file);
  } catch (error) {
    console.error("[Drive File Error]", error);
    res.status(500).json({
      error: "Erro ao obter informações do arquivo",
    });
  }
});

export default router;
