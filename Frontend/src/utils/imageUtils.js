const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function getLogoUrl(url) {
  if (!url) return null;
  if (typeof url === 'string') {
    if (url.startsWith('data:image/') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If raw base64 data string without header
    if (url.length > 50 && !url.includes('/')) {
      return `data:image/png;base64,${url}`;
    }
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE}${cleanUrl}`;
  }
  return url;
}