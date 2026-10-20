export function safeImage(value) {
  if (typeof value !== 'string' || /[\\\u0000-\u001f]/.test(value)) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { if (new URL(value).protocol === 'https:') return value; } catch { /* Unusable server reference. */ }
  return null;
}

// Optional compatibility only: existing listing responses do not supply images.
// Never replace missing listing images with photographs of another item.
export const listingImages = item => Array.isArray(item?.images)
  && item.images.every(image => typeof image === 'string' && safeImage(image)) ? item.images : null;
