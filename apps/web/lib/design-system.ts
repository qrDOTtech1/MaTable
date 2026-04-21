/**
 * Design System Tokens
 * Inspiré de Mockup 2A - Mode sombre par défaut
 */

export const DESIGN_TOKENS = {
  // ─── Colors ─────────────────────────────────────────────────────────────
  colors: {
    // Primary
    primary: "#f97316", // Orange
    primaryLight: "#fb923c",
    primaryDark: "#ea580c",

    // Backgrounds
    bg: {
      primary: "#0a0a0a", // Main background
      secondary: "#111",  // Cards, sections
      tertiary: "#141414", // Hover states
    },

    // Text
    text: {
      primary: "#ffffff",
      secondary: "#ffffff80", // text-white/50
      tertiary: "#ffffff40", // text-white/30
      quaternary: "#ffffff20", // text-white/10
    },

    // Borders
    border: {
      default: "#ffffff0f", // border-white/[0.06]
      light: "#ffffff1a",   // border-white/10
      lighter: "#ffffff33", // border-white/20
    },

    // Status colors
    status: {
      pending: {
        bg: "rgba(234, 179, 8, 0.05)", // yellow-500/5
        border: "rgba(234, 179, 8, 0.2)", // yellow-500/20
        text: "#eab308", // yellow-400
      },
      cooking: {
        bg: "rgba(249, 115, 22, 0.05)", // orange-500/5
        border: "rgba(249, 115, 22, 0.2)", // orange-500/20
        text: "#f97316", // orange-400
      },
      served: {
        bg: "rgba(16, 185, 129, 0.05)", // emerald-500/5
        border: "rgba(16, 185, 129, 0.2)", // emerald-500/20
        text: "#10b981", // emerald-400
      },
      error: {
        bg: "rgba(239, 68, 68, 0.05)", // red-500/5
        border: "rgba(239, 68, 68, 0.2)", // red-500/20
        text: "#ef4444", // red-400
      },
    },
  },

  // ─── Spacing ────────────────────────────────────────────────────────────
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "48px",
    "4xl": "64px",
  },

  // ─── Typography ─────────────────────────────────────────────────────────
  typography: {
    h1: {
      fontSize: "48px",
      fontWeight: 900,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "32px",
      fontWeight: 800,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: "24px",
      fontWeight: 700,
      lineHeight: 1.3,
    },
    body: {
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: 1.6,
    },
    small: {
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: 1.5,
    },
    xs: {
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: 1.4,
    },
  },

  // ─── Borders ────────────────────────────────────────────────────────────
  borders: {
    radius: {
      sm: "8px",
      md: "12px",
      lg: "16px",
      xl: "20px",
      full: "9999px",
    },
    width: {
      default: "1px",
      thick: "2px",
    },
  },

  // ─── Shadows ────────────────────────────────────────────────────────────
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.1)",
  },

  // ─── Transitions ────────────────────────────────────────────────────────
  transitions: {
    fast: "150ms ease-in-out",
    normal: "300ms ease-in-out",
    slow: "500ms ease-in-out",
  },

  // ─── Z-Index ────────────────────────────────────────────────────────────
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    tooltip: 50,
  },
};

// ─── Responsive Breakpoints ─────────────────────────────────────────────────
export const BREAKPOINTS = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// ─── CSS Variables for Tailwind ─────────────────────────────────────────────
export const getCSSVariables = () => `
  :root {
    --color-primary: ${DESIGN_TOKENS.colors.primary};
    --color-primary-light: ${DESIGN_TOKENS.colors.primaryLight};
    --color-primary-dark: ${DESIGN_TOKENS.colors.primaryDark};

    --color-bg-primary: ${DESIGN_TOKENS.colors.bg.primary};
    --color-bg-secondary: ${DESIGN_TOKENS.colors.bg.secondary};
    --color-bg-tertiary: ${DESIGN_TOKENS.colors.bg.tertiary};

    --color-text-primary: ${DESIGN_TOKENS.colors.text.primary};
    --color-text-secondary: ${DESIGN_TOKENS.colors.text.secondary};
    --color-text-tertiary: ${DESIGN_TOKENS.colors.text.tertiary};

    --color-border: ${DESIGN_TOKENS.colors.border.default};

    --radius-md: ${DESIGN_TOKENS.borders.radius.md};
    --radius-lg: ${DESIGN_TOKENS.borders.radius.lg};
  }
`;

// ─── Utility Functions ───────────────────────────────────────────────────────
export const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

export const getStatusColor = (status: "pending" | "cooking" | "served" | "error") => {
  return DESIGN_TOKENS.colors.status[status];
};

export const getStatusEmoji = (status: "pending" | "cooking" | "served") => {
  const emojis = {
    pending: "⏳",
    cooking: "👨‍🍳",
    served: "✅",
  };
  return emojis[status];
};
