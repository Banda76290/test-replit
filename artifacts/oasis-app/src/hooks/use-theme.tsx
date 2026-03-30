import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStorageKey(userId?: string) {
  return userId ? `oasis-theme-${userId}` : "oasis-theme-default";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: string;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      if (stored === "dark" || stored === "light") return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(getStorageKey(userId), theme);
    } catch {}
  }, [theme, userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      const resolved: Theme = stored === "dark" || stored === "light" ? stored : "light";
      setTheme(resolved);
      applyTheme(resolved);
    } catch {}
  }, [userId]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
