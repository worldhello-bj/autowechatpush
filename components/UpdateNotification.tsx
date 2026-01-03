/**
 * Update Notification Component
 * 
 * Shows update notifications when a new version is available.
 * Only works in Electron environment.
 */

import React, { useState, useEffect } from 'react';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';

const UpdateNotification: React.FC = () => {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron;

  useEffect(() => {
    if (!isElectron) return;

    const electronAPI = (window as any).electronAPI;

    const handleUpdateAvailable = (data: UpdateInfo) => {
      console.log('[Update] Update available:', data.version);
      setUpdateInfo(data);
      setStatus('available');
      setDismissed(false);
    };

    const handleUpdateNotAvailable = (data: { version: string }) => {
      console.log('[Update] No update available, current version:', data.version);
      setStatus('idle');
    };

    const handleUpdateDownloadProgress = (data: DownloadProgress) => {
      setProgress(data);
      setStatus('downloading');
    };

    const handleUpdateDownloaded = (data: UpdateInfo) => {
      console.log('[Update] Update downloaded:', data.version);
      setUpdateInfo(data);
      setStatus('downloaded');
      setProgress(null);
    };

    const handleUpdateError = (data: { message: string }) => {
      console.error('[Update] Update error:', data.message);
      setError(data.message);
      setStatus('error');
    };

    // Listen for update events
    electronAPI.onUpdateAvailable?.(handleUpdateAvailable);
    electronAPI.onUpdateNotAvailable?.(handleUpdateNotAvailable);
    electronAPI.onUpdateDownloadProgress?.(handleUpdateDownloadProgress);
    electronAPI.onUpdateDownloaded?.(handleUpdateDownloaded);
    electronAPI.onUpdateError?.(handleUpdateError);

    // Cleanup listeners when component unmounts or dependencies change
    return () => {
      const api = (window as any).electronAPI;
      api?.offUpdateAvailable?.(handleUpdateAvailable);
      api?.offUpdateNotAvailable?.(handleUpdateNotAvailable);
      api?.offUpdateDownloadProgress?.(handleUpdateDownloadProgress);
      api?.offUpdateDownloaded?.(handleUpdateDownloaded);
      api?.offUpdateError?.(handleUpdateError);
    };
  }, [isElectron]);

  // Manual check for updates
  const handleCheckUpdates = async () => {
    if (!isElectron) return;
    
    setStatus('checking');
    setError(null);
    
    try {
      const result = await (window as any).electronAPI.checkForUpdates();
      if (!result.success) {
        setError(result.message);
        setStatus('error');
      }
    } catch (err) {
      setError('检查更新失败');
      setStatus('error');
    }
  };

  // Download update
  const handleDownloadUpdate = async () => {
    if (!isElectron) return;
    
    setStatus('downloading');
    setProgress({ percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 });
    
    try {
      const result = await (window as any).electronAPI.downloadUpdate();
      if (!result.success) {
        setError(result.message);
        setStatus('error');
      }
    } catch (err) {
      setError('下载更新失败');
      setStatus('error');
    }
  };

  // Install update
  const handleInstallUpdate = async () => {
    if (!isElectron) return;
    
    try {
      await (window as any).electronAPI.installUpdate();
    } catch (err) {
      setError('安装更新失败');
      setStatus('error');
    }
  };

  // Dismiss notification
  const handleDismiss = () => {
    setDismissed(true);
  };

  // Don't show in non-Electron environment or if dismissed
  if (!isElectron || dismissed) return null;

  // Don't show for idle status
  if (status === 'idle' || status === 'checking') return null;

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {/* Update Available */}
      {status === 'available' && updateInfo && (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-up">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-green-600">system_update</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800">发现新版本</h4>
                <p className="text-sm text-gray-500 mt-1">
                  版本 {updateInfo.version} 已可用
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-icons text-lg">close</span>
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDismiss}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                稍后提醒
              </button>
              <button
                onClick={handleDownloadUpdate}
                className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1"
              >
                <span className="material-icons text-lg">download</span>
                下载更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Downloading */}
      {status === 'downloading' && progress && (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800">正在下载更新</h4>
                <p className="text-sm text-gray-500">
                  {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">
              {progress.percent.toFixed(1)}% - {formatBytes(progress.bytesPerSecond)}/s
            </p>
          </div>
        </div>
      )}

      {/* Downloaded */}
      {status === 'downloaded' && updateInfo && (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-up">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-green-600">check_circle</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800">更新已就绪</h4>
                <p className="text-sm text-gray-500 mt-1">
                  版本 {updateInfo.version} 已下载完成，重启应用以安装更新。
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-icons text-lg">close</span>
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDismiss}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                稍后重启
              </button>
              <button
                onClick={handleInstallUpdate}
                className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1"
              >
                <span className="material-icons text-lg">restart_alt</span>
                立即重启
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <div className="bg-white rounded-xl shadow-2xl border border-red-200 overflow-hidden animate-slide-up">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-icons text-red-600">error</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800">更新失败</h4>
                <p className="text-sm text-red-500 mt-1">{error}</p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-icons text-lg">close</span>
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDismiss}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                关闭
              </button>
              <button
                onClick={handleCheckUpdates}
                className="flex-1 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-1"
              >
                <span className="material-icons text-lg">refresh</span>
                重试
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateNotification;
