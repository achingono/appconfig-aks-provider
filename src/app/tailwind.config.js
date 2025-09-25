/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Blue color scheme (default)
        'blue-primary': '#3498db',
        'blue-secondary': '#2c3e50',
        // Green color scheme
        'green-primary': '#27ae60',
        'green-secondary': '#1e3a2e',
        // Dynamic colors that will be used with CSS variables
        primary: '#3498db', // Default to blue
        secondary: '#2c3e50', // Default to blue
        danger: '#e74c3c',
        success: '#2ecc71',
        warning: '#f39c12',
        info: '#3498db',
        dark: '#2c3e50',
      },
    },
  },
  plugins: [],
}
