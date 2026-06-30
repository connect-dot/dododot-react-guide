import type { Config } from "tailwindcss";

const config: Config = {
  prefix: "crg-",
  content: ["./src/**/*.{ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        pretendard: [
          "Pretendard",
          "Pretendard Variable",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      /**
       * DODODOT typography tokens, px-based so they render at the intended
       * size regardless of the host's root font-size (e.g. 62.5%).
       * Use as: crg-text-body, crg-text-h3, etc.
       */
      fontSize: {
        display: ["60px", { lineHeight: "72px", fontWeight: "700" }],
        h1: ["48px", { lineHeight: "60px", fontWeight: "700" }],
        h2: ["36px", { lineHeight: "45px", fontWeight: "700" }],
        h3: ["24px", { lineHeight: "36px", fontWeight: "700" }],
        h4: ["21px", { lineHeight: "32px", fontWeight: "700" }],
        "body-b": ["16px", { lineHeight: "28px", fontWeight: "700" }],
        body: ["16px", { lineHeight: "28px", fontWeight: "500" }],
        "label-b": ["14px", { lineHeight: "24px", fontWeight: "700" }],
        label: ["14px", { lineHeight: "24px", fontWeight: "500" }],
        "subtitle-1": ["18px", { lineHeight: "20px", fontWeight: "500" }],
        "subtitle-2": ["16px", { lineHeight: "20px", fontWeight: "500" }],
        "subtitle-3": ["14px", { lineHeight: "20px", fontWeight: "500" }],
      },
      colors: {
        /* Full DODODOT palette via CSS variables so the host can override */
        primary: {
          "00": "var(--crg-primary-00, #000000)",
          10: "var(--crg-primary-10, #172554)",
          20: "var(--crg-primary-20, #1E3A8A)",
          30: "var(--crg-primary-30, #1D4ED8)",
          40: "var(--crg-primary-40, #2563EB)",
          50: "var(--crg-primary-50, #1D4ED8)",
          60: "var(--crg-primary-60, #2563EB)",
          70: "var(--crg-primary-70, #60A5FA)",
          80: "var(--crg-primary-80, #93C5FD)",
          90: "var(--crg-primary-90, #DBEAFE)",
          95: "var(--crg-primary-95, #EFF6FF)",
          98: "var(--crg-primary-98, #F8FAFC)",
          99: "var(--crg-primary-99, #FAFAF9)",
          100: "var(--crg-primary-100, #FFFFFF)",
        },
        gray: {
          "00": "var(--crg-gray-00, #000000)",
          10: "var(--crg-gray-10, #191C1D)",
          20: "var(--crg-gray-20, #2E3132)",
          30: "var(--crg-gray-30, #444748)",
          40: "var(--crg-gray-40, #5C5F5F)",
          50: "var(--crg-gray-50, #747878)",
          60: "var(--crg-gray-60, #8E9192)",
          70: "var(--crg-gray-70, #A9ACAC)",
          80: "var(--crg-gray-80, #C4C7C7)",
          90: "var(--crg-gray-90, #E1E3E3)",
          95: "var(--crg-gray-95, #EFF1F1)",
          99: "var(--crg-gray-99, #FAFAFA)",
          100: "var(--crg-gray-100, #FFFFFF)",
        },
        /* Semantic */
        brand: "var(--crg-brand, #2563EB)",
        "brand-foreground": "var(--crg-brand-foreground, #FFFFFF)",
        "brand-hover": "var(--crg-brand-hover, #1D4ED8)",
        foreground: "var(--crg-foreground, #191C1D)",
        subtle: "var(--crg-subtle, #5C5F5F)",
        icon: "var(--crg-icon, #8E9192)",
        muted: "var(--crg-muted, #EFF1F1)",
        "muted-foreground": "var(--crg-muted-foreground, #2E3132)",
        border: "var(--crg-border, #E1E3E3)",
        surface: "var(--crg-surface, #FFFFFF)",
        "surface-alt": "var(--crg-surface-alt, #FAFAFA)",
        success: "var(--crg-success, #10B981)",
      },
      boxShadow: {
        "elevation-01": "var(--crg-shadow-elevation-01)",
        "elevation-02": "var(--crg-shadow-elevation-02)",
        "elevation-03": "var(--crg-shadow-elevation-03)",
        "elevation-04": "var(--crg-shadow-elevation-04)",
        tooltip: "var(--crg-shadow-elevation-02)",
        toast: "var(--crg-shadow-elevation-01)",
        highlight: "0 0 0 4px rgba(37, 99, 235, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
