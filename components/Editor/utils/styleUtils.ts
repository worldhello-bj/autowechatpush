// --- Helper: Color Mapping ---
export const getStyleColors = (style?: string) => {
  switch(style) {
      case 'red': return { main: '#fa5151', bg: '#fff0f0', border: '#ffc2c2' };
      case 'blue': return { main: '#3498db', bg: '#f0f8ff', border: '#cce6ff' };
      case 'purple': return { main: '#9b59b6', bg: '#fbf2ff', border: '#e8ccec' };
      case 'orange': return { main: '#f39c12', bg: '#fef5e6', border: '#fdebd0' };
      case 'gold': return { main: '#d4af37', bg: '#fcf8e3', border: '#f7ecb5' };
      case 'warning': return { main: '#e6a23c', bg: '#fdf6ec', border: '#faecd8' };
      case 'quote': return { main: '#888888', bg: '#f7f7f7', border: '#cccccc' };
      case 'green': return { main: '#07c160', bg: '#f6fffa', border: '#e0f2e9' };
      case 'pink': return { main: '#eb4d9c', bg: '#fff0f7', border: '#ffc2e2' };
      case 'cyan': return { main: '#00bcd4', bg: '#e0f7fa', border: '#b2ebf2' };
      case 'gradient': return { main: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', bg: 'linear-gradient(135deg, #f5f7fa 0%, #f8f4ff 100%)', border: '#d4c4e8' };
      case 'teal': return { main: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' };
      case 'indigo': return { main: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' };
      case 'amber': return { main: '#d97706', bg: '#fffbeb', border: '#fde68a' };
      case 'rose': return { main: '#e11d48', bg: '#fff1f2', border: '#fecdd3' };
      case 'lime': return { main: '#65a30d', bg: '#f7fee7', border: '#d9f99d' };
      case 'gradient_warm': return { main: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', bg: 'linear-gradient(135deg, #fff7ed 0%, #fef2f2 100%)', border: '#fed7aa' };
      case 'gradient_cool': return { main: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', bg: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', border: '#bfdbfe' };
      case 'gradient_nature': return { main: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)', bg: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)', border: '#a7f3d0' };
      default: return { main: '#07c160', bg: '#f6fffa', border: '#e0f2e9' }; // Default Green
  }
}

// --- Helper: Get Callout Icon (using styled symbols for better design) ---
export const getCalloutIcon = (icon?: string) => {
  switch(icon) {
      case 'info': return { symbol: 'i', color: '#3498db', bg: '#f0f8ff' };
      case 'warning': return { symbol: '!', color: '#f39c12', bg: '#fef5e6' };
      case 'success': return { symbol: '✓', color: '#07c160', bg: '#f6fffa' };
      case 'error': return { symbol: '×', color: '#fa5151', bg: '#fff0f0' };
      case 'tip': return { symbol: '★', color: '#d4af37', bg: '#fcf8e3' };
      case 'note': return { symbol: '¶', color: '#9b59b6', bg: '#fbf2ff' };
      default: return { symbol: 'i', color: '#3498db', bg: '#f0f8ff' };
  }
}
