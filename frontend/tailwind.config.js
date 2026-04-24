/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563EB', // Primary Blue
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        mint: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#6EE7B7', // Mint Green
          600: '#059669',
        },
        navy: {
          900: '#1E293B', // Deep Navy
        },
        surface: '#FFFFFF',
        'app-bg': '#F5F7FA', // Light Gray
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        poppins: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08)',
        modal: '0 20px 60px -10px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        lg: '16px',
        xl: '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
