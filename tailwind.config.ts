import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        textColor: '#0F2552',
        // You can add custom colors here if needed
      },
      boxShadow: {
        pry: '8px 3px 22px 0px rgba(150, 150, 150, 0.15)',
        sec: '16px 0px 32px 0px rgba(150, 150, 150, 0.25)',
      },
    },
  },
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [],
};

export default config;
