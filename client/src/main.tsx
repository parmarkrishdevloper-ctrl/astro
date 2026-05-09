import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { I18nProvider } from './i18n';
import { ThemeProvider } from './theme/ThemeProvider';
import { useFontScale, applyFontScale } from './store/font-scale.store';

// Apply the persisted font scale ASAP so the first paint matches the user's
// preference (no flash from 100 % to their saved zoom).
applyFontScale(useFontScale.getState().scale);
useFontScale.subscribe((s) => applyFontScale(s.scale));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

// Fade out the Ganesh boot loader once React has painted the first frame.
// We use a double rAF to wait until React has actually committed; that way
// the loader stays put until the app is ready, eliminating the white flash.
//
// Honour `prefers-reduced-motion` by hiding instantly without the fade.
const boot = document.getElementById('ganesh-boot');
if (boot) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (reduce) {
      boot.remove();
      return;
    }
    boot.classList.add('is-hiding');
    // CSS transition is 600ms — give it a hair more before removing from DOM.
    setTimeout(() => boot.remove(), 700);
  }));
}
