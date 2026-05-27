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

// Remove the boot-time HTML splash as soon as React has committed.
// The React-side <GaneshSplash> component now controls the session-aware
// splash (shown once per browser tab session, then never again). We just
// need to clear the static HTML so it doesn't double up with the React one.
const boot = document.getElementById('ganesh-boot');
if (boot) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    boot.remove();
  }));
}
