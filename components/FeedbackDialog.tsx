/**
 * Feedback Dialog Component
 * 
 * A dialog component for users to submit feedback to administrators.
 * Supports internationalization (Chinese and English).
 */

import React, { useState } from 'react';
import { getAccessToken } from '../services/apiClient';
import { getStoredLogs, getStoredLogCount } from '../services/logger';
import { useI18n } from '../services/i18n';

// API base URL - configurable via environment variable
const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

// Types
type FeedbackCategory = 'bug' | 'feature' | 'question' | 'other';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Category icons mapping
const categoryIcons: Record<FeedbackCategory, string> = {
  bug: 'bug_report',
  feature: 'lightbulb',
  question: 'help',
  other: 'more_horiz',
};

// Default app version when not in Electron
const DEFAULT_APP_VERSION = '1.0.0';

// Get app version from Electron or default
const getAppVersion = async (): Promise<string> => {
  if (typeof window !== 'undefined' && (window as any).electronAPI?.getAppVersion) {
    try {
      return await (window as any).electronAPI.getAppVersion();
    } catch {
      return DEFAULT_APP_VERSION;
    }
  }
  return DEFAULT_APP_VERSION;
};

// Get platform
const getPlatform = (): string => {
  if (typeof window !== 'undefined' && (window as any).electronAPI?.platform) {
    return (window as any).electronAPI.platform;
  }
  return navigator.platform || 'web';
};

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachLogs, setAttachLogs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get log count for display
  const logCount = getStoredLogCount();

  // Category options with translations
  const categories: { value: FeedbackCategory; label: string; icon: string }[] = [
    { value: 'bug', label: t.feedback.categories.bug, icon: categoryIcons.bug },
    { value: 'feature', label: t.feedback.categories.feature, icon: categoryIcons.feature },
    { value: 'question', label: t.feedback.categories.question, icon: categoryIcons.question },
    { value: 'other', label: t.feedback.categories.other, icon: categoryIcons.other },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setMessage({ type: 'error', text: t.feedback.titleRequired });
      return;
    }
    
    if (!content.trim()) {
      setMessage({ type: 'error', text: t.feedback.contentRequired });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const appVersion = await getAppVersion();
      const platform = getPlatform();
      const accessToken = getAccessToken();

      // Get logs if user opted to attach them
      const logContent = attachLogs ? getStoredLogs() : undefined;

      // Use API_BASE constant instead of hardcoded path
      const response = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          category,
          title: title.trim(),
          content: content.trim(),
          appVersion,
          platform,
          logContent,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: t.feedback.submitSuccess });
        setTitle('');
        setContent('');
        setCategory('bug');
        setAttachLogs(false);
        // Close dialog after 2 seconds
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error?.message || t.feedback.submitError });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t.feedback.networkError });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="material-icons text-green-500">feedback</span>
              {t.feedback.title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {t.feedback.description}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.feedback.categoryLabel}</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                    category === cat.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="material-icons text-lg">{cat.icon}</span>
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.feedback.titleLabel} <span className="text-red-500">{t.feedback.required}</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.feedback.titlePlaceholder}
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
            <div className="text-xs text-gray-400 mt-1 text-right">{title.length}/100</div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.feedback.contentLabel} <span className="text-red-500">{t.feedback.required}</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.feedback.contentPlaceholder}
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
            />
            <div className="text-xs text-gray-400 mt-1 text-right">{content.length}/2000</div>
          </div>

          {/* Attach Logs Option */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attachLogs}
                onChange={(e) => setAttachLogs(e.target.checked)}
                className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-400"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-gray-500 text-lg">description</span>
                  <span className="font-medium text-gray-700">{t.feedback.attachLogs}</span>
                  {logCount > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {logCount} {t.feedback.logRecords}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {t.feedback.attachLogsDesc}
                </p>
              </div>
            </label>
          </div>

          {/* Message */}
          {message && (
            <div className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className="material-icons text-lg">
                {message.type === 'success' ? 'check_circle' : 'error'}
              </span>
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              {t.feedback.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.feedback.submitting}
                </>
              ) : (
                <>
                  <span className="material-icons text-lg">send</span>
                  {t.feedback.submit}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackDialog;
