/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "oklch(0.13 0.01 260)",
        foreground: "oklch(0.95 0 0)",
        card: "oklch(0.17 0.01 260)",
        "card-foreground": "oklch(0.95 0 0)",
        popover: "oklch(0.15 0.01 260)",
        "popover-foreground": "oklch(0.95 0 0)",
        primary: "oklch(0.75 0.15 175)",
        "primary-foreground": "oklch(0.13 0.01 260)",
        secondary: "oklch(0.22 0.01 260)",
        "secondary-foreground": "oklch(0.95 0 0)",
        muted: "oklch(0.22 0.01 260)",
        "muted-foreground": "oklch(0.65 0 0)",
        accent: "oklch(0.75 0.15 175)",
        "accent-foreground": "oklch(0.13 0.01 260)",
        destructive: "oklch(0.55 0.2 25)",
        "destructive-foreground": "oklch(0.95 0 0)",
        border: "oklch(0.28 0.01 260)",
        input: "oklch(0.22 0.01 260)",
        ring: "oklch(0.75 0.15 175)",
      },
      borderRadius: {
        lg: "0.625rem",
        md: "calc(0.625rem - 2px)",
        sm: "calc(0.625rem - 4px)",
      },
    },
  },
  plugins: [],
};
