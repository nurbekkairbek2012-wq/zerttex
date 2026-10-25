import '@fontsource/unbounded/latin-500.css';
import '@fontsource/unbounded/latin-700.css';
import '@fontsource/onest/latin-400.css';
import '@fontsource/onest/latin-500.css';
import '@fontsource/onest/latin-600.css';
// Cyrillic subsets load only when Cyrillic text (the team name) is on the page.
import '@fontsource/unbounded/cyrillic-700.css';
import '@fontsource/onest/cyrillic-400.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);

// Installable app (PWA): register the service worker on real hosting only.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}
