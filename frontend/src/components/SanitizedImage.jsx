import React, { useState, useEffect } from 'react';
import { getSanitizedImage } from '../utils/imageSanitizer';

/**
 * SanitizedImage Component
 * Renders images with alpha channel sanitization to prevent
 * rectangular artifacts on dark backgrounds.
 */
const SanitizedImage = ({ 
  src, 
  alt, 
  className, 
  style,
  onClick,
  onLoad,
  ...props 
}) => {
  const [sanitizedSrc, setSanitizedSrc] = useState(null);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    let mounted = true;
    setError(false);
    setSanitizedSrc(null);
    
    if (!src) return;
    
    const loadSanitized = async () => {
      try {
        const result = await getSanitizedImage(src);
        if (mounted) {
          setSanitizedSrc(result);
        }
      } catch (err) {
        console.error('SanitizedImage error:', err);
        if (mounted) {
          setError(true);
          setSanitizedSrc(src); // Fallback to original
        }
      }
    };
    
    loadSanitized();
    
    return () => {
      mounted = false;
    };
  }, [src]);
  
  // Show original while loading sanitized version
  const displaySrc = sanitizedSrc || src;
  
  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
      onLoad={onLoad}
      {...props}
    />
  );
};

export default SanitizedImage;
