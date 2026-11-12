import '@fontsource/rubik/400.css';
import '@fontsource/rubik/700.css';
import '@fontsource/rubik/900.css';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/styles.css';

// Make sure the cartoon font is ready before Phaser draws text.
const fontsReady = (document as any).fonts?.load ? Promise.all(['400 20px Rubik', '700 20px Rubik', '900 20px Rubik'].map((f) => (document as any).fonts.load(f))).catch(() => {}) : Promise.resolve();

fontsReady.finally(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
