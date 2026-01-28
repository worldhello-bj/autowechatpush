// --- Helper: HTML Escape for XSS Prevention ---
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// --- Helper: Convert plain text to safe HTML ---
export const textToSafeHtml = (text: string): string => {
  const escaped = escapeHtml(text);
  return `<p style="font-size: 16px; line-height: 1.8; color: #444;">${escaped.replace(/\n\n/g, '</p><p style="font-size: 16px; line-height: 1.8; color: #444; margin-top: 16px;">').replace(/\n/g, '<br/>')}</p>`;
};
