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
        colors: {
          'thread-lens': {
            'primary': '#026873', 
            'secondary': '#026873',
            'dark': '#04BF8A',
            'mint': '#025940',
            'neutral': '#03A64A',
            'accent': '#E8FFF2',
          },
        },
      },
    },
    plugins: [],
  }