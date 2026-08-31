/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        frambuesa: {
          50: '#FDF2F5',
          100: '#FCE4EC',
          200: '#F8BBD0',
          300: '#F48FB1',
          400: '#EC407A',
          500: '#E91E63', // Principal / CTA
          600: '#D81B60',
          700: '#C2185B',
          800: '#AD1457',
          900: '#880E4F',
        },
        chocolate: {
          50: '#EFEBE9',
          100: '#D7CCC8',
          200: '#BCAAA4',
          300: '#A1887F',
          400: '#8D6E63',
          500: '#795548',
          600: '#6D4C41',
          700: '#5D4037', // Secundario / Cabeceras
          800: '#4E342E',
          900: '#3E2723',
        },
        trigo: {
          50: '#FAF6F0',
          100: '#F5EBE1',
          200: '#EAD8C3',
          300: '#DFC4A5',
          400: '#D4B088',
          500: '#C5A076', // Neutro de Apoyo / Trigo Dorado
          600: '#B58E62',
          700: '#9C774E',
          800: '#7E5F3B',
          900: '#5C4427',
        },
        crema: {
          DEFAULT: '#FDF4E0', // Fondos de Tarjetas / Superficies
          light: '#FFF9ED',
          dark: '#F4E5C3',
        },
        canvas: '#FDFBF7', // Fondo General (Blanco Hueso Cálido)
        panadero: '#333333', // Texto Base (Gris Panadero)
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        artisan: ['"Great Vibes"', '"Dancing Script"', 'cursive'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'warm': '0 4px 20px -2px rgba(93, 64, 55, 0.08), 0 2px 6px -2px rgba(93, 64, 55, 0.04)',
        'warm-lg': '0 10px 25px -3px rgba(93, 64, 55, 0.12), 0 4px 10px -2px rgba(93, 64, 55, 0.06)',
        'warm-xl': '0 20px 30px -4px rgba(93, 64, 55, 0.16), 0 8px 12px -4px rgba(93, 64, 55, 0.08)',
        'frambuesa-glow': '0 0 20px rgba(233, 30, 99, 0.35)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}
