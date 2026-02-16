/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "var(--color-void)",
        deep: "var(--color-deep)",
        panel: "var(--color-panel)",
        surface: "var(--color-surface)",
        "b-subtle": "var(--color-border-subtle)",
        "b-default": "var(--color-border)",
        muted: "var(--color-muted)",
        "t-default": "var(--color-text)",
        "t-bright": "var(--color-text-bright)",
        heading: "var(--color-heading)",
        fiber: "var(--color-fiber)",
        "fiber-dim": "var(--color-fiber-dim)",
        "fiber-glow": "var(--color-fiber-glow)",
        signal: "var(--color-signal)",
        "signal-dim": "var(--color-signal-dim)",
        warn: "var(--color-warn)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
