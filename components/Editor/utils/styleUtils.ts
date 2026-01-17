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
