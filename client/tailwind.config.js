import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    resolve(here, 'index.html'),
    resolve(here, 'src/**/*.{ts,tsx,js,jsx}'),
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        saffron: '#F58220',
        deepSaffron: '#FF9933',
        vedicMaroon: '#7B1E1E',
        vedicGold: '#D4AF37',
        parchment: '#FFF8E7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Noto Serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
        devanagari: ['"Noto Sans Devanagari"', 'Inter', 'serif'],
      },
    },
  },
  plugins: [],
};
