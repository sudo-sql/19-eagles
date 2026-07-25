import { createContext, useContext, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { clubhouse, onCourse, type Theme } from "@fairway/ui-tokens";

const ThemeContext = createContext<Theme>(onCourse);

/** Dark on-course theme is the default; clubhouse (light) follows system when browsing. */
export function ThemeProvider({ children, forceOnCourse }: { children: ReactNode; forceOnCourse?: boolean }) {
  const scheme = useColorScheme();
  const theme = forceOnCourse || scheme !== "light" ? onCourse : clubhouse;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
