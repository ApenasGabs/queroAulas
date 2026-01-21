/**
 * useVideoCache Hook
 * Gerencia download e cache de vídeos no IndexedDB
 */

import { useCallback, useState } from "react";

interface CachedVideo {
  fileId: string;
  fileName: string;
  blob: Blob;
  downloadedAt: string;
  size: number;
}

const DB_NAME = "QueroAulas_VideoCache";
const STORE_NAME = "videos";
const DB_VERSION = 1;

// Inicializar banco de dados
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "fileId" });
      }
    };
  });
};

// Salvar vídeo em cache
const saveVideoToCache = async (
  fileId: string,
  fileName: string,
  blob: Blob,
) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const data: CachedVideo = {
      fileId,
      fileName,
      blob,
      downloadedAt: new Date().toISOString(),
      size: blob.size,
    };

    const request = store.put(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(data);
  });
};

// Recuperar vídeo do cache
const getVideoFromCache = async (
  fileId: string,
): Promise<CachedVideo | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(fileId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

// Deletar vídeo do cache
const deleteVideoFromCache = async (fileId: string) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(fileId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(null);
  });
};

// Listar todos os vídeos em cache
const listCachedVideos = async (): Promise<CachedVideo[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const useVideoCache = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [cachedVideos, setCachedVideos] = useState<Map<string, CachedVideo>>(
    new Map(),
  );

  // Carregar vídeos em cache ao iniciar
  const loadCachedVideos = useCallback(async () => {
    try {
      const videos = await listCachedVideos();
      const map = new Map(videos.map((v) => [v.fileId, v]));
      setCachedVideos(map);
    } catch (error) {
      console.error("[useVideoCache] Error loading cached videos:", error);
    }
  }, []);

  // Baixar vídeo do Google Drive
  const downloadVideo = useCallback(
    async (fileId: string, fileName: string, accessToken: string) => {
      try {
        setIsDownloading(true);
        setDownloadProgress(0);

        // Usar endpoint de download do Google Drive
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao baixar: ${response.statusText}`);
        }

        // Se a response tem content-length, usar para progresso
        const contentLength = response.headers.get("content-length");
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        // Ler chunks do response para progresso
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const chunks: (Uint8Array | ArrayBuffer)[] = [];
        let loadedBytes = 0;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          loadedBytes += value.length;

          if (total > 0) {
            setDownloadProgress((loadedBytes / total) * 100);
          }
        }

        // Criar blob do vídeo
        const blob = new Blob(chunks as BlobPart[], { type: "video/mp4" });

        // Salvar em cache
        await saveVideoToCache(fileId, fileName, blob);

        // Atualizar lista de vídeos em cache
        await loadCachedVideos();

        setDownloadProgress(0);
        return URL.createObjectURL(blob);
      } catch (error) {
        console.error("[useVideoCache] Error downloading video:", error);
        setDownloadProgress(0);
        throw error;
      } finally {
        setIsDownloading(false);
      }
    },
    [loadCachedVideos],
  );

  // Reproduzir vídeo em cache
  const playVideoFromCache = useCallback(async (fileId: string) => {
    try {
      const cached = await getVideoFromCache(fileId);
      if (cached) {
        return URL.createObjectURL(cached.blob);
      }
      return null;
    } catch (error) {
      console.error("[useVideoCache] Error playing cached video:", error);
      return null;
    }
  }, []);

  // Deletar vídeo do cache
  const deleteCachedVideo = useCallback(
    async (fileId: string) => {
      try {
        await deleteVideoFromCache(fileId);
        await loadCachedVideos();
      } catch (error) {
        console.error("[useVideoCache] Error deleting cached video:", error);
      }
    },
    [loadCachedVideos],
  );

  // Obter tamanho total do cache
  const getCacheSize = useCallback(async () => {
    try {
      const videos = await listCachedVideos();
      return videos.reduce((total, v) => total + v.size, 0);
    } catch (error) {
      console.error("[useVideoCache] Error getting cache size:", error);
      return 0;
    }
  }, []);

  // Verificar se vídeo está em cache
  const isVideoCached = useCallback(
    (fileId: string) => cachedVideos.has(fileId),
    [cachedVideos],
  );

  return {
    isDownloading,
    downloadProgress,
    cachedVideos,
    loadCachedVideos,
    downloadVideo,
    playVideoFromCache,
    deleteCachedVideo,
    getCacheSize,
    isVideoCached,
  };
};
