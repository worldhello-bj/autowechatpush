/**
 * Internationalization (i18n) - Locale Definitions
 * 
 * Translation files for Chinese (zh) and English (en)
 */

export type Locale = 'zh' | 'en';

export interface FeedbackDialogTranslations {
  title: string;
  description: string;
  categoryLabel: string;
  categories: {
    bug: string;
    feature: string;
    question: string;
    other: string;
  };
  titleLabel: string;
  titlePlaceholder: string;
  contentLabel: string;
  contentPlaceholder: string;
  attachLogs: string;
  attachLogsDesc: string;
  logRecords: string;
  cancel: string;
  submit: string;
  submitting: string;
  required: string;
  // Validation messages
  titleRequired: string;
  contentRequired: string;
  submitSuccess: string;
  submitError: string;
  networkError: string;
}

export interface Translations {
  feedback: FeedbackDialogTranslations;
}

// Chinese translations
export const zh: Translations = {
  feedback: {
    title: '提交反馈',
    description: '您的反馈将帮助我们改进产品，感谢您的支持！',
    categoryLabel: '反馈类型',
    categories: {
      bug: '问题反馈',
      feature: '功能建议',
      question: '使用咨询',
      other: '其他',
    },
    titleLabel: '标题',
    titlePlaceholder: '简要描述您的反馈',
    contentLabel: '详细描述',
    contentPlaceholder: '请详细描述您遇到的问题或建议...',
    attachLogs: '附带日志信息',
    attachLogsDesc: '将自动附带应用运行日志，帮助开发者更快定位问题。日志仅包含操作记录，不含敏感信息。',
    logRecords: '条记录',
    cancel: '取消',
    submit: '提交反馈',
    submitting: '提交中...',
    required: '*',
    titleRequired: '请输入标题',
    contentRequired: '请输入反馈内容',
    submitSuccess: '反馈提交成功，感谢您的反馈！',
    submitError: '提交失败，请重试',
    networkError: '网络错误，请检查网络连接',
  },
};

// English translations
export const en: Translations = {
  feedback: {
    title: 'Submit Feedback',
    description: 'Your feedback helps us improve our product. Thank you for your support!',
    categoryLabel: 'Feedback Type',
    categories: {
      bug: 'Bug Report',
      feature: 'Feature Request',
      question: 'Question',
      other: 'Other',
    },
    titleLabel: 'Title',
    titlePlaceholder: 'Briefly describe your feedback',
    contentLabel: 'Description',
    contentPlaceholder: 'Please describe your issue or suggestion in detail...',
    attachLogs: 'Attach Logs',
    attachLogsDesc: 'Automatically attach application logs to help developers diagnose issues faster. Logs only contain operation records, no sensitive information.',
    logRecords: 'records',
    cancel: 'Cancel',
    submit: 'Submit Feedback',
    submitting: 'Submitting...',
    required: '*',
    titleRequired: 'Please enter a title',
    contentRequired: 'Please enter feedback content',
    submitSuccess: 'Feedback submitted successfully. Thank you!',
    submitError: 'Submission failed. Please try again',
    networkError: 'Network error. Please check your connection',
  },
};

// All available locales
export const locales: Record<Locale, Translations> = {
  zh,
  en,
};
