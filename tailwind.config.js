/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['neue-haas-grotesk-display', 'neue-haas-grotesk-text', 'system-ui', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }