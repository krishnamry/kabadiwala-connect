/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dhatu (धातु) Design System Palette
        copper: {
          50: '#FAF4F2',
          100: '#F3E6E2',
          200: '#E7CBC4',
          300: '#DBAFA4',
          400: '#C87A64',
          500: '#B5573A', // Primary Copper/Rust
          600: '#A14A30',
          700: '#873C25',
          800: '#6B2F1C',
          900: '#4F2213',
        },
        steel: {
          50: '#F6F7F7',
          100: '#EBEDED',
          200: '#D5D8D7',
          300: '#A9B0AE',
          400: '#7A8481',
          500: '#525C59',
          600: '#3F4744',
          700: '#343B38',
          800: '#2E3532', // Secondary Deep Steel
          900: '#1F2422',
          950: '#141816',
        },
        brass: {
          50: '#FCF9EE',
          100: '#F7F1D6',
          200: '#EFE1A7',
          300: '#E5CF75',
          400: '#D8BB47',
          500: '#C9A227', // Accent Brass Gold
          600: '#B08B1C',
          700: '#8E6D14',
          800: '#6F5410',
          900: '#4F3B0A',
        },
        paper: {
          50: '#FBF9F5',
          100: '#F4EFE6', // Light Background (Recycled Paper)
          200: '#ECE4D5',
          300: '#DFD3BF',
          400: '#CDBC9F',
          500: '#B49F7D',
        },
        charcoal: {
          800: '#282724',
          900: '#1C1B19', // Dark Background (Warm Charcoal)
          950: '#121110',
        },
        signal: {
          500: '#C1443C', // Hazard / Safety Signal Red
          600: '#A9362E',
        },
        forest: {
          500: '#3B6B4E', // Verified / Trust Forest Green
          600: '#315A41',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        amber: {
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        display: ['"Roboto Slab"', 'serif'],
        body: ['"Mukta"', '"Noto Sans Devanagari"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'press': 'inset 0 2px 4px rgba(0,0,0,0.25)',
        'tactile': '0 2px 0 #2E3532',
        'tactile-lg': '0 4px 0 #2E3532',
        'stamp': '0 0 0 2px #3B6B4E, 0 2px 4px rgba(59,107,78,0.2)',
      }
    },
  },
  plugins: [],
}
