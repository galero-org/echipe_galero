/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        secondary: "var(--color-secondary)",
        "secondary-hover": "var(--color-secondary-hover)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        muted: "var(--color-text-muted)",
        "on-primary": "var(--color-text-on-primary)",
        "on-accent": "var(--color-text-on-accent)",
        blackAlt: "var(--color-black-alt)",
        grayLight: "var(--color-gray-light)",
        success: "var(--color-success)",
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        info: "var(--color-info)",
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
