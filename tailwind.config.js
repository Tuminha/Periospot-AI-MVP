/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'periospot-white': '#FFFFFF',
        'periospot-cream': '#F5F5F5',
        'periospot-blue-strong': '#1E40AF',
        'periospot-blue-mystic': '#3B82F6',
      },
    },
  },
  plugins: [],
} 