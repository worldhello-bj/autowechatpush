import { useState } from 'react';
import { X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          contact: contact.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitStatus('success');
      setFeedback('');
      setContact('');
      
      // Close dialog after 1.5 seconds
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-4">反馈建议</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              您的反馈 *
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="请告诉我们您的想法..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
              联系方式（可选）
            </label>
            <input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="邮箱或微信号"
              disabled={isSubmitting}
            />
          </div>

          {submitStatus === 'success' && (
            <div className="text-green-600 text-sm">
              感谢您的反馈！
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="text-red-600 text-sm">
              提交失败，请稍后重试
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting || !feedback.trim()}
            >
              {isSubmitting ? '提交中...' : '提交'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
