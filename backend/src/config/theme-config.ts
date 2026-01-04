/**
 * Theme Configuration for WeChat Article Styling
 * Implements the "configuration layer" pattern for separating visual DNA from logic
 */

export interface ThemeColors {
  primaryBg: string;      // 主背景色
  accentRed: string;      // 强调红色
  accentYellow: string;   // 装饰黄色
  textMain: string;       // 正文颜色
  textLight: string;      // 浅色文字
  borderColor: string;    // 边框颜色
}

export interface ThemeTypography {
  letterSpacing: string;  // 字间距
  lineHeight: string;     // 行高
  baseFontSize: string;   // 基础字号
  titleFontSize: string;  // 标题字号
}

export interface ThemeSpacing {
  sectionMargin: string;  // section间距
  contentPadding: string; // 内容内边距
  borderRadius: string;   // 圆角大小
}

export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
}

/**
 * Default Theme: Red-Gold Academy Style (红金学院风)
 * Based on common WeChat official account styling patterns
 */
export const DEFAULT_THEME: ThemeConfig = {
  name: 'red-gold-academy',
  colors: {
    primaryBg: '#fff4e7',    // 米黄底色
    accentRed: '#c60201',    // 强调红
    accentYellow: '#ffd427', // 装饰黄
    textMain: '#333333',     // 正文黑
    textLight: '#ffffff',    // 反白字
    borderColor: '#e0e0e0',  // 边框灰
  },
  typography: {
    letterSpacing: '1.5px',
    lineHeight: '1.75em',
    baseFontSize: '15px',
    titleFontSize: '18px',
  },
  spacing: {
    sectionMargin: '20px 0',
    contentPadding: '15px',
    borderRadius: '8px',
  },
};

/**
 * Alternative Theme: Blue Professional (蓝色专业风)
 */
export const BLUE_PROFESSIONAL_THEME: ThemeConfig = {
  name: 'blue-professional',
  colors: {
    primaryBg: '#f0f8ff',
    accentRed: '#1a73e8',
    accentYellow: '#fbbc04',
    textMain: '#202124',
    textLight: '#ffffff',
    borderColor: '#dadce0',
  },
  typography: {
    letterSpacing: '0.5px',
    lineHeight: '1.6em',
    baseFontSize: '16px',
    titleFontSize: '20px',
  },
  spacing: {
    sectionMargin: '16px 0',
    contentPadding: '12px',
    borderRadius: '4px',
  },
};

/**
 * Get theme by name
 */
export const getTheme = (themeName?: string): ThemeConfig => {
  switch (themeName) {
    case 'blue-professional':
      return BLUE_PROFESSIONAL_THEME;
    case 'red-gold-academy':
    default:
      return DEFAULT_THEME;
  }
};

/**
 * Apply theme to inline styles
 * Converts theme config to actual CSS style strings
 */
export const applyThemeToStyles = (theme: ThemeConfig) => {
  return {
    // Container styles
    container: `background-color: ${theme.colors.primaryBg}; padding: ${theme.spacing.contentPadding}; font-size: ${theme.typography.baseFontSize}; line-height: ${theme.typography.lineHeight}; letter-spacing: ${theme.typography.letterSpacing}; color: ${theme.colors.textMain};`,
    
    // Title styles
    title: `background-color: ${theme.colors.accentRed}; color: ${theme.colors.textLight}; padding: 5px ${theme.spacing.contentPadding}; border-radius: 0 ${theme.spacing.borderRadius} ${theme.spacing.borderRadius} 0; font-size: ${theme.typography.titleFontSize}; font-weight: bold;`,
    
    // Accent decoration
    accent: `background-color: ${theme.colors.accentYellow}; border-radius: 50%;`,
    
    // Section wrapper
    section: `margin: ${theme.spacing.sectionMargin}; max-width: 100%; box-sizing: border-box;`,
  };
};
