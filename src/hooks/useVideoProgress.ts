/**
 * useVideoProgress Hook
 * Gerencia progresso de vídeos no localStorage
 */

import { useCallback, useEffect, useState } from "react";

export interface VideoProgress {
  fileId: string;
  fileName: string;
  folderId: string;
  status: "not-started" | "in-progress" | "completed";
  lastWatched: string; // ISO timestamp
  createdAt: string;
}

export interface ProgressData {
  userId: string;
  videos: Record<string, VideoProgress>;
  lastVideoFileId?: string;
  lastFolderId?: string;
  updatedAt: string;
}

const STORAGE_KEY = "queroaulas_progress";

export const useVideoProgress = (userId: string | undefined) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    if (!userId) {
      setIsLoaded(true);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as ProgressData;
        if (data.userId === userId) {
          setProgressData(data);
        } else {
          // Different user, start fresh
          const newData: ProgressData = {
            userId,
            videos: {},
            updatedAt: new Date().toISOString(),
          };
          setProgressData(newData);
        }
      } else {
        // First time
        const newData: ProgressData = {
          userId,
          videos: {},
          updatedAt: new Date().toISOString(),
        };
        setProgressData(newData);
      }
    } catch (error) {
      console.error("[useVideoProgress] Error loading from localStorage:", error);
      const newData: ProgressData = {
        userId,
        videos: {},
        updatedAt: new Date().toISOString(),
      };
      setProgressData(newData);
    }

    setIsLoaded(true);
  }, [userId]);

  // Save to localStorage whenever progressData changes
  useEffect(() => {
    if (!progressData || !userId) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
    } catch (error) {
      console.error("[useVideoProgress] Error saving to localStorage:", error);
    }
  }, [progressData, userId]);

  // Mark video as in-progress
  const markInProgress = useCallback(
    (fileId: string, fileName: string, folderId: string) => {
      if (!progressData) return;

      const now = new Date().toISOString();
      const existing = progressData.videos[fileId];

      setProgressData({
        ...progressData,
        videos: {
          ...progressData.videos,
          [fileId]: {
            fileId,
            fileName,
            folderId,
            status: "in-progress",
            lastWatched: now,
            createdAt: existing?.createdAt || now,
          },
        },
        lastVideoFileId: fileId,
        lastFolderId: folderId,
        updatedAt: now,
      });
    },
    [progressData]
  );

  // Mark video as completed
  const markCompleted = useCallback(
    (fileId: string, fileName: string, folderId: string) => {
      if (!progressData) return;

      const now = new Date().toISOString();
      const existing = progressData.videos[fileId];

      setProgressData({
        ...progressData,
        videos: {
          ...progressData.videos,
          [fileId]: {
            fileId,
            fileName,
            folderId,
            status: "completed",
            lastWatched: now,
            createdAt: existing?.createdAt || now,
          },
        },
        updatedAt: now,
      });
    },
    [progressData]
  );

  // Get video progress
  const getVideoProgress = useCallback(
    (fileId: string): VideoProgress | undefined => {
      return progressData?.videos[fileId];
    },
    [progressData]
  );

  // Get last video watched
  const getLastVideo = useCallback((): VideoProgress | undefined => {
    if (!progressData?.lastVideoFileId) return undefined;
    return progressData.videos[progressData.lastVideoFileId];
  }, [progressData]);

  // Get completed videos count
  const getCompletedCount = useCallback(
    (folderId?: string): number => {
      if (!progressData) return 0;

      return Object.values(progressData.videos).filter((video) => {
        if (folderId && video.folderId !== folderId) return false;
        return video.status === "completed";
      }).length;
    },
    [progressData]
  );

  // Get total videos count
  const getTotalCount = useCallback(
    (folderId?: string): number => {
      if (!progressData) return 0;

      if (!folderId) return Object.keys(progressData.videos).length;

      return Object.values(progressData.videos).filter(
        (video) => video.folderId === folderId
      ).length;
    },
    [progressData]
  );

  // Clear all progress
  const clearProgress = useCallback(() => {
    if (progressData) {
      const newData: ProgressData = {
        ...progressData,
        videos: {},
        lastVideoFileId: undefined,
        updatedAt: new Date().toISOString(),
      };
      setProgressData(newData);
    }
  }, [progressData]);

  // Clear progress for specific folder
  const clearFolderProgress = useCallback(
    (folderId: string) => {
      if (!progressData) return;

      const filtered = Object.fromEntries(
        Object.entries(progressData.videos).filter(
          ([, video]) => video.folderId !== folderId
        )
      );

      setProgressData({
        ...progressData,
        videos: filtered,
        lastVideoFileId:
          progressData.lastVideoFileId &&
          filtered[progressData.lastVideoFileId]
            ? progressData.lastVideoFileId
            : undefined,
        updatedAt: new Date().toISOString(),
      });
    },
    [progressData]
  );

  return {
    progressData,
    isLoaded,
    markInProgress,
    markCompleted,
    getVideoProgress,
    getLastVideo,
    getCompletedCount,
    getTotalCount,
    clearProgress,
    clearFolderProgress,
  };
};
