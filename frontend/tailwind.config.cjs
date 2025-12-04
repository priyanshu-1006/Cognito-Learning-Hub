module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  darkMode: "class",
  theme: {
    extend: {
      fontSize: {
        // Mobile-first font sizes
        "xs-mobile": ["0.875rem", { lineHeight: "1.5" }], // 14px
        "sm-mobile": ["1rem", { lineHeight: "1.5" }], // 16px
        "base-mobile": ["1.125rem", { lineHeight: "1.6" }], // 18px
        "lg-mobile": ["1.25rem", { lineHeight: "1.6" }], // 20px
      },
      spacing: {
        // Touch-friendly minimum sizes
        touch: "44px",
        "touch-sm": "36px",
      },
      animation: {
        spotlight: "spotlight 2s ease .75s 1 forwards",
        gradient: "gradient 8s linear infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        spotlight: {
          "0%": {
            opacity: 0,
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: 1,
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
        gradient: {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        glow: {
          "0%": {
            "box-shadow": "0 0 20px rgba(99, 102, 241, 0.3)",
          },
          "100%": {
            "box-shadow": "0 0 40px rgba(139, 92, 246, 0.6)",
          },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
