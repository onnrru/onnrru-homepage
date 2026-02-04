/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // The user's requested "Midnight Ink" color: Dark black with a blue tone
        ink: {
          DEFAULT: '#0B1019', // Deep blue-black
          light: '#1A2333',
          dark: '#02040a',
          transparent: 'rgba(11, 16, 25, 0.9)',
        },
        paper: '#F5F5F7', // Soft white paper
        accent: '#D93025', // Start with a classic red seal color for the "Point", can be changed
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'sans-serif'],
        serif: ['Noto Serif KR', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 1.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 1s ease-out forwards',
        'ripple': 'ripple 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
