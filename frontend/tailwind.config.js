/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      boxShadow: {
        panel: "0 20px 45px rgba(0, 0, 0, 0.38)"
      },
      backgroundImage: {
        noise:
          "radial-gradient(circle at 0% 0%, rgba(26, 145, 232, 0.22) 0%, transparent 44%), radial-gradient(circle at 100% 100%, rgba(255, 152, 0, 0.18) 0%, transparent 40%)"
      }
    }
  },
  plugins: []
};
