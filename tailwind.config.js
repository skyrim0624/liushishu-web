import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#a75a8c",
        secondary: "#5f8f70",
        tertiary: "#d98b16",
        surface: "#fff6df",
        "surface-soft": "#f8eac9",
        "surface-2": "#eed9a9",
        ink: "#203d32",
        muted: "#6b6f5e",
        outline: "#decaa4"
      },
      fontFamily: {
        body: ["WenKai", "Kaiti SC", "STKaiti", "serif"]
      }
    }
  },
  plugins: [forms]
};
