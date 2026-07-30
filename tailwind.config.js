/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#003B5C',
        cyan: '#00A3E0',
        teal: '#00BFA5',
        gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            800: '#1F2937',
            900: '#111827',
        }
      }
    },
  },
  plugins: [],
}