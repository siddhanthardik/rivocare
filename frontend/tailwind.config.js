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
        'xs': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        'sm': '0 1px 3px 0 rgba(16, 24, 40, 0.1), 0 1px 2px -1px rgba(16, 24, 40, 0.1)',
        'md': '0 4px 6px -1px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.1)',
        'lg': '0 10px 15px -3px rgba(16, 24, 40, 0.1), 0 4px 6px -4px rgba(16, 24, 40, 0.1)',
        'xl': '0 20px 25px -5px rgba(16, 24, 40, 0.1), 0 8px 10px -6px rgba(16, 24, 40, 0.1)',
        '2xl': '0 25px 50px -12px rgba(16, 24, 40, 0.25)',
        card: '0px 2px 4px rgba(16, 24, 40, 0.06), 0px 4px 8px rgba(16, 24, 40, 0.04)',
        'card-hover': '0px 12px 24px -4px rgba(16, 24, 40, 0.08), 0px 4px 8px -2px rgba(16, 24, 40, 0.03)',
        modal: '0 20px 40px -10px rgba(16, 24, 40, 0.2)',
        'premium': '0px 8px 24px rgba(149, 157, 165, 0.1)',
      },
      borderRadius: {
        DEFAULT: '0.625rem', // 10px
        sm: '0.375rem',      // 6px
        md: '0.5rem',        // 8px
        lg: '0.75rem',       // 12px
        xl: '1rem',          // 16px
        '2xl': '1.25rem',    // 20px
        '3xl': '1.5rem',     // 24px
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
