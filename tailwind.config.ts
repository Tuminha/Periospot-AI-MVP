import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        periospot: {
          blue: {
            strong: '#15365a',  // Strong Periospot Blue
            mystic: '#003049',  // Mystic Blue
          },
          red: {
            crimson: '#15365a',  // Crimson Blaze
            dark: '#669bbc',    // Periospot Red
          },
          cream: '#669bbc',     // Vanilla Cream
          black: '#000000',     // Black
          white: '#ffffff',     // White
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' }
        }
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    },
  },
  plugins: [],
  darkMode: 'class',
} satisfies Config;
