/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        'primary-dark': '#4338CA',
        mainbg: '#F3F4F6',
        card: '#FFFFFF',
        inputbg: '#F9FAFB',
        border: '#D1D5DB',
        heading: '#1E293B',
        'secondary-text': '#64748B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
