import { useCallback, useState } from 'react';
import { photos, photoSrcSet, photoUrl, type PhotoId, type Width } from '../lib/photos';

/** Real photo with responsive sizes, lazy loading and a soft fade-in once it has loaded. */
export function Photo({
  id, className = '', sizes = '100vw', width = 1280, eager = false, alt,
}: { id: PhotoId; className?: string; sizes?: string; width?: Width; eager?: boolean; alt?: string }) {
  const [loaded, setLoaded] = useState(false);
  // Cached images can finish before React attaches onLoad, so check on mount too.
  const ref = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    <img
      ref={ref}
      className={`photo ${loaded ? 'is-loaded' : ''} ${className}`}
      src={photoUrl(id, width)}
      srcSet={photoSrcSet(id)}
      sizes={sizes}
      alt={alt ?? photos[id].alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      referrerPolicy="no-referrer"
    />
  );
}
