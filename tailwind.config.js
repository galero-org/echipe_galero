/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        text: "var(--color-text)",
        blackAlt: "var(--color-black-alt)",
        grayLight: "var(--color-gray-light)",
        whatsapp: {
          DEFAULT: "#25D366", // Culoarea principală WhatsApp
          dark: "#128C7E", // O nuanță mai închisă pentru hover
        },
      },
      fontFamily: {
        primary: ["var(--font-primary)"],
        secondary: ["var(--font-secondary)"],
        text: ["var(--font-text)"],
        accent: ["var(--font-accent)"],
        khand: ["var(--font-khand)"],
      },
      fontSize: {
        headingKhand: "var(--font-size-khand)",
      },
    },
  },
  plugins: [],
};
