/**
 * @fairway/ui-tokens — single source of truth for the Fairway design system.
 * Consumed by React Native (StyleSheet) and web (Tailwind preset / CSS vars).
 *
 * Aesthetic: premium, editorial, calm. "Modern clubhouse meets sports-performance app."
 * Deliberately NOT bright-white/light-blue 18Birdies. Dark "on-course" theme is default.
 */

export const palette = {
  // Base — deep "midnight fairway" green family + warm charcoal
  fairway950: "#071A0F",
  fairway900: "#0B2818",
  fairway800: "#123A24",
  fairway700: "#1B4D31",
  fairway600: "#2A6343",
  charcoal950: "#141412",
  charcoal900: "#1C1B18",
  charcoal800: "#26241F",
  charcoal700: "#33302A",
  // Surfaces — off-white cream
  cream50: "#FBF9F4",
  cream100: "#F5F1E8",
  cream200: "#EAE3D3",
  cream300: "#D8CDB4",
  // Single accent — augusta gold
  gold: "#C9A227",
  goldBright: "#E0B93E",
  goldDeep: "#A5851C",
  // Semantic (over/under par ONLY)
  underPar: "#3FA46A",
  overPar: "#C75146",
  // Neutrals for text on dark
  ink: "#181712",
  paper: "#F5F1E8",
  mutedOnDark: "#9AA79B",
  mutedOnLight: "#6E6A5E",
} as const;

export type ThemeName = "onCourse" | "clubhouse";

export interface Theme {
  name: ThemeName;
  bg: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  underPar: string;
  overPar: string;
  hairline: string;
  /** True-black-leaning background for AMOLED battery savings on the GPS screen. */
  amoledBg: string;
}

/** Default on-course theme: dark, AMOLED-friendly (Fix List #11). */
export const onCourse: Theme = {
  name: "onCourse",
  bg: palette.charcoal950,
  surface: palette.charcoal900,
  surfaceRaised: palette.charcoal800,
  text: palette.cream100,
  textMuted: palette.mutedOnDark,
  accent: palette.gold,
  accentText: palette.ink,
  underPar: palette.underPar,
  overPar: palette.overPar,
  hairline: "#3A372F",
  amoledBg: "#000000",
};

/** Light "clubhouse" theme for browsing/stats. */
export const clubhouse: Theme = {
  name: "clubhouse",
  bg: palette.cream100,
  surface: palette.cream50,
  surfaceRaised: "#FFFFFF",
  text: palette.ink,
  textMuted: palette.mutedOnLight,
  accent: palette.goldDeep,
  accentText: palette.cream50,
  underPar: "#2E7D4F",
  overPar: "#B03A2E",
  hairline: palette.cream200,
  amoledBg: palette.cream100,
};

export const themes = { onCourse, clubhouse } as const;

/**
 * Typography. Display face carries score numerals ("leaderboard feel");
 * geometric sans for UI. Fonts loaded per-platform; these are the roles.
 */
export const typography = {
  display: {
    family: "Fraunces", // high-contrast display serif (Google Fonts, OFL)
    fallbacks: ["Georgia", "serif"],
  },
  sans: {
    family: "Instrument Sans", // clean geometric sans (Google Fonts, OFL)
    fallbacks: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  },
  mono: { family: "IBM Plex Mono", fallbacks: ["ui-monospace", "monospace"] },
  scale: {
    /** Primary on-course distance numeral. Sunlight-readable at arm's length. */
    yardagePrimary: 72, // ≥64pt requirement
    yardageSecondary: 28,
    scoreCard: 34,
    h1: 32,
    h2: 24,
    h3: 19,
    body: 16,
    caption: 13,
    micro: 11,
  },
  weights: { regular: "400", medium: "500", semibold: "600", black: "800" },
} as const;

/** 8pt grid. */
export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64,
} as const;

export const radii = { sm: 6, md: 10, lg: 16, xl: 24, pill: 999 } as const;

/** Large touch targets — users wear golf gloves. */
export const touch = { minTarget: 48, scoringStepper: 56 } as const;

/** Restrained motion. Birdie celebration ≤800ms, always skippable. */
export const motion = {
  tick: 120,
  transition: 220,
  celebrationMax: 800,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

/** Topographic contour-line motif (SVG path data, tile 200x200). Subtle texture only. */
export const contourMotif = {
  viewBox: "0 0 200 200",
  strokeOpacity: 0.07,
  paths: [
    "M0,40 C50,20 90,60 140,42 S200,55 200,55",
    "M0,80 C40,64 100,96 150,80 S200,92 200,92",
    "M0,120 C60,100 110,140 160,120 S200,130 200,130",
    "M0,160 C50,148 100,176 150,158 S200,168 200,168",
  ],
} as const;

/** Tailwind preset for the web app. */
export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        fairway: {
          950: palette.fairway950, 900: palette.fairway900, 800: palette.fairway800,
          700: palette.fairway700, 600: palette.fairway600,
        },
        charcoal: {
          950: palette.charcoal950, 900: palette.charcoal900,
          800: palette.charcoal800, 700: palette.charcoal700,
        },
        cream: {
          50: palette.cream50, 100: palette.cream100,
          200: palette.cream200, 300: palette.cream300,
        },
        gold: { DEFAULT: palette.gold, bright: palette.goldBright, deep: palette.goldDeep },
        underpar: palette.underPar,
        overpar: palette.overPar,
      },
      fontFamily: {
        display: [typography.display.family, ...typography.display.fallbacks],
        sans: [typography.sans.family, ...typography.sans.fallbacks],
      },
      borderRadius: { card: `${radii.lg}px` },
    },
  },
} as const;
