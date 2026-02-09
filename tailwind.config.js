/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
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
        headingBlack: '#323036',
        ur: '#C00000',
        pGray: '#4F4E56',
        lightRed: '#FF8080',
        darkBlue: '#4059BF',
        borderGray: '#DDDCE0',
        gray2: '#656565',
        bGray: '#323036',
        bGray2: '#DDDCE0',
        iHeading: '#3A3A3A',
        iText: '#616161',
        sGray: '#F6F6F6',
        dot: '#B0AFB6',
        imageGray: '#9DA3A7',
        headingBlue: '#4B4885',
        solidGray: '#F3F3F3',
        darkBlue1: '#344054',
        darkBlue2: '#2A254B',
        descBlue: '#505977',
        borderBlue: '#4E4D93',
        bgGray: '#EAEAEA',
        offGreen: '#299E22',
        bannerBlue: '#2E3E77',
        navGray: '#6F6F6F',
        verified: '#1d771d',
        lightBlue: '#ECEFF8',
        bgBlue: '#f8f5f7',
        sidebarBlue: '#0c0a1d',
        sidebarText: '#d8dae0',
        // Sidebar colors
        sidebarBlue: '#1e3a5f',      // Main sidebar background
        sidebarText: '#94a3b8',       // Default text color
        darkBlue: '#0f172a',          // Active indicator
        darkBlue1: '#1e40af',         // Active background
        lightBlue: '#3b82f6',         // Hover accent
        bgBlue: '#f8fafc',            // Main background
        bgGray: '#f1f5f9',            // Secondary background
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
