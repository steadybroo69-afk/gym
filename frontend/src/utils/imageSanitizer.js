/**
 * Canvas-based PNG Alpha Sanitization Utility
 * Fixes premultiplied alpha / dark RGB data in transparent pixels
 * that causes rectangular artifacts on dark backgrounds.
 */

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Sanitize a PNG image by cleaning up transparent pixels
 */
const sanitizePng = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Sanitize transparent and near-transparent pixels
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          
          if (alpha === 0) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          } else if (alpha < 15) {
            const factor = alpha / 15;
            data[i] = Math.round(data[i] * factor);
            data[i + 1] = Math.round(data[i + 1] * factor);
            data[i + 2] = Math.round(data[i + 2] * factor);
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Try to sanitize image via CORS proxy (skip direct attempt since CDN blocks CORS)
 */
const sanitizeViaProxy = async (originalUrl) => {
  const proxyUrl = `${API_URL}/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  return await sanitizePng(proxyUrl);
};

// Cache for sanitized images to avoid re-processing
const sanitizedCache = new Map();
const pendingRequests = new Map();

/**
 * Get sanitized image URL with caching
 * Uses proxy by default since CDN doesn't support CORS
 */
export const getSanitizedImage = async (originalUrl) => {
  if (!originalUrl) return originalUrl;
  
  // Check cache first
  if (sanitizedCache.has(originalUrl)) {
    return sanitizedCache.get(originalUrl);
  }
  
  // Check if there's already a pending request for this URL
  if (pendingRequests.has(originalUrl)) {
    return pendingRequests.get(originalUrl);
  }
  
  // Create new request
  const requestPromise = (async () => {
    try {
      // Go straight to proxy since CDN blocks CORS
      const sanitized = await sanitizeViaProxy(originalUrl);
      sanitizedCache.set(originalUrl, sanitized);
      return sanitized;
    } catch (err) {
      console.warn('Sanitization failed for:', originalUrl, err.message);
      // Return original as fallback
      return originalUrl;
    } finally {
      pendingRequests.delete(originalUrl);
    }
  })();
  
  pendingRequests.set(originalUrl, requestPromise);
  return requestPromise;
};
