export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        text: "var(--text)",
        "text-h": "var(--text-h)",
        bg: "var(--bg)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
      },
      fontFamily: {
        sans: "var(--sans)",
        heading: "var(--heading)",
        mono: "var(--mono)",
      },
      boxShadow: {
        custom: "var(--shadow)",
      },
    },
  },
  plugins: [],
}
