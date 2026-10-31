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
        cyber: {
          darkest: '#05070b',
          darker: '#090d16',
          panel: '#0c111d',
          border: '#1b2438',
          accent: '#10b981',
          danger: '#f43f5e',
          warning: '#f59e0b',
          info: '#06b6d4',
          muted: '#64748b'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar 4s linear infinite',
        'glow-crimson': 'glowCrimson 1.5s ease-in-out infinite alternate',
        'glow-emerald': 'glowEmerald 2s ease-in-out infinite alternate',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glowCrimson: {
          '0%': { boxShadow: '0 0 5px rgba(244, 63, 94, 0.3), inset 0 0 5px rgba(244, 63, 94, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(244, 63, 94, 0.7), inset 0 0 10px rgba(244, 63, 94, 0.4)' },
        },
        glowEmerald: {
          '0%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
