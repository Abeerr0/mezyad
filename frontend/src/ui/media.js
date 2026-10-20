import {apiBase} from '../api.js';

// Signed API paths belong to the Backend; original static design assets stay local.
// Prefix the untouched path, retaining expires/signature bytes. Never attach a session token.
export function safeImage(value) {
  if (typeof value !== 'string' || /[\\\u0000-\u001f]/.test(value)) return null;
  if(value.startsWith('//'))return null;
  try {
    const url=new URL(value,window.location.origin);
    if(url.username||url.password||[...url.searchParams.keys()].some(k=>/^(token|access_token|authorization)$/i.test(k)))return null;
    if(value.startsWith('/')&&!value.startsWith('//'))return value.startsWith('/api/v1/images/')?apiBase()+value:value;
    if(url.protocol==='https:'||(url.protocol==='http:'&&url.origin===new URL(apiBase(),window.location.origin).origin))return value;
  } catch { /* Unusable server reference. */ }
  return null;
}
export const isSignedImage=value=>typeof value==='string'&&/\/api\/v1\/images\//.test(value)&&/[?&]signature=/.test(value);
export const listingImages = item => Array.isArray(item?.images)
  && item.images.every(image => typeof image === 'string' && safeImage(image)) ? item.images : null;
export const imageIdentity=value=>typeof value==='string'?value.split('?')[0]:null;
