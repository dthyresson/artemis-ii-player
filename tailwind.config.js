/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nasa: {
          blue: '#0B3D91',
          red: '#FC3D21',
          gray: '#A7B1B7',
          darkblue: '#061D4A',
        },
        phase: {
          earth: '#00BFFF',
          translunar: '#FF8C00',
          flyby: '#DA70D6',
          return: '#00FF7F',
          moon: '#C0C0C0',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
