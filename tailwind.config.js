import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },

      fontFamily: {
        'Outfit-Medium': ['Outfit-Medium', ...defaultTheme.fontFamily.sans],
        'Golos-Regular': ['Golos-Regular', ...defaultTheme.fontFamily.sans],
        'Golos-Medium': ['Golos-Medium', ...defaultTheme.fontFamily.sans],
        'Golos-ExtraBold': ['Golos-ExtraBold', ...defaultTheme.fontFamily.sans],
      },

      fontSize: {
        xxs: '.60rem',
        pr: '13px',
        xxxs: '.50rem',
      },

      colors: {
        primary: "#1d4ed8",
        secondary: "#2563eb",
        textPrimary: "#1d4ed8",
        textSecondary: "#2563eb",
        textMuted: "#64748b",
        heading: "#0f172a",
        background: "#f8fafc",
        card: "#ffffff",
        border: "#e2e8f0",
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      width: {
        tabMax: '1440px',
        desktopMax: '1670px',
      },
      margin: {
        desktop: 'px-[5vw]',
      },
    },
  },
  plugins: [],
};
