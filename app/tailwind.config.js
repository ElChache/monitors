/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Standard colors that might not be included in v4
        white: '#ffffff',
        black: '#000000',
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Monitors! Brand Colors from Visual Style Guide
        primary: {
          DEFAULT: '#0d47a1', // Improved Accessible Blue with better contrast
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#0d47a1', // Main brand color - WCAG compliant
          700: '#1565c0',
          800: '#0d47a1',
          900: '#062046',
        },
        secondary: {
          DEFAULT: '#2ecc71', // Positive Green
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#2ecc71', // Main secondary color
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          DEFAULT: '#e74c3c', // Alert Red
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#e74c3c', // Main accent color
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c',
        neutral: '#95a5a6',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        'h1': ['24px', { fontWeight: '700' }],
        'h2': ['20px', { fontWeight: '700' }],
        'body': ['16px', { fontWeight: '400' }],
        'small': ['14px', { fontWeight: '400' }],
      },
      borderRadius: {
        'monitors': '8px', // Consistent rounded corners from style guide
      },
      boxShadow: {
        'monitors': '0 2px 8px rgba(0, 0, 0, 0.1)', // Soft shadow from style guide
        'monitors-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}