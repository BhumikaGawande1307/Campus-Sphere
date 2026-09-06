/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#0a0c16', // Luxury Royal Night Background
          900: '#111425', // Primary Elevated Surface
          850: '#171b32', // Highlight Card Surface
          800: '#1f2444', // Active Surface
          750: '#272e56',
          700: '#31396a',
        },
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed', // Primary Violet
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        electric: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#7c3aed',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'sm': '0 2px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 14px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.05)',
        'lg': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 10px -4px rgba(0, 0, 0, 0.05)',
        'glow-sm': '0 0 16px -2px rgba(139, 92, 246, 0.25)',
        'glow-md': '0 0 24px -2px rgba(139, 92, 246, 0.35)',
        'glow-violet': '0 0 24px -2px rgba(139, 92, 246, 0.35)',
        'glow-fuchsia': '0 0 24px -2px rgba(217, 70, 239, 0.35)',
        'glow-pink': '0 0 24px -2px rgba(236, 72, 153, 0.35)',
        'glow-emerald': '0 0 20px -2px rgba(16, 185, 129, 0.3)',
        'glow-amber': '0 0 20px -2px rgba(245, 158, 11, 0.3)',
      },
      borderRadius: {
        '2xl': '1rem',      // 16px - Standard Cards
        '3xl': '1.25rem',   // 20px - Large Containers / Heroes
        '4xl': '1.5rem',    // 24px - Outer Panels
      },
    },
  },
  plugins: [],
}
