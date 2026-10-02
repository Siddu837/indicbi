/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        card: '#161F30',
        cardBorder: '#23334D',
        accentGold: '#F59E0B',
        accentYellow: '#FCD34D',
        accentBlue: '#38BDF8',
        accentGreen: '#10B981',
      },
    },
  },
  plugins: [],
};
