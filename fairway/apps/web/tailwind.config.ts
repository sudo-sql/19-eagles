import type { Config } from "tailwindcss";
import { tailwindPreset } from "@fairway/ui-tokens";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [tailwindPreset as unknown as Config],
} satisfies Config;
