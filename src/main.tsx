import '@fontsource/unbounded/latin-500.css';
import '@fontsource/unbounded/latin-700.css';
import '@fontsource/onest/latin-400.css';
import '@fontsource/onest/latin-500.css';
import '@fontsource/onest/latin-600.css';
// Cyrillic (Russian) and Cyrillic Extended (Kazakh ә ғ қ ң ө ұ ү һ і) subsets: unicode-range means
// the browser downloads them only when such letters are on the page.
import '@fontsource/unbounded/cyrillic-500.css';
import '@fontsource/unbounded/cyrillic-700.css';
import '@fontsource/unbounded/cyrillic-ext-500.css';
import '@fontsource/unbounded/cyrillic-ext-700.css';
import '@fontsource/onest/cyrillic-400.css';
import '@fontsource/onest/cyrillic-500.css';
import '@fontsource/onest/cyrillic-600.css';
import '@fontsource/onest/cyrillic-ext-400.css';
import '@fontsource/onest/cyrillic-ext-500.css';
import '@fontsource/onest/cyrillic-ext-600.css';
// Hindi (Devanagari script).
import '@fontsource/noto-sans-devanagari/devanagari-400.css';
import '@fontsource/noto-sans-devanagari/devanagari-500.css';
import '@fontsource/noto-sans-devanagari/devanagari-600.css';
import '@fontsource/noto-sans-devanagari/devanagari-700.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import { getLang, loadDict } from './lib/i18n';
import { localizeKb } from './lib/kb';
import './styles.css';

// A visitor who chose a language before: load its dictionary first, so the page opens in it.
const lang = getLang();
void loadDict(lang).then(() => {
  localizeKb(lang);
  createRoot(document.getElementById('root')!).render(<App />);
});

// Installable app (PWA): register the service worker on real hosting only.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}
