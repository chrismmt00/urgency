"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ColorModeCtx = createContext({ mode: "light", toggle: () => {} });
export const useColorMode = () => useContext(ColorModeCtx);

function makeTheme(mode) {
  // Map CSS variables to MUI palette for components
  const isDark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      background: {
        default:
          getComputedStyle(document.documentElement)
            .getPropertyValue("--background")
            ?.trim() || (isDark ? "#0a0a0a" : "#ffffff"),
        paper:
          getComputedStyle(document.documentElement)
            .getPropertyValue("--surface")
            ?.trim() || (isDark ? "#1e1f22" : "#ffffff"),
      },
      text: {
        primary:
          getComputedStyle(document.documentElement)
            .getPropertyValue("--foreground")
            ?.trim() || (isDark ? "#ededed" : "#171717"),
        secondary:
          getComputedStyle(document.documentElement)
            .getPropertyValue("--text-secondary")
            ?.trim() || (isDark ? "rgba(255,255,255,.65)" : "rgba(0,0,0,.62)"),
      },
      primary: {
        main:
          getComputedStyle(document.documentElement)
            .getPropertyValue("--brand-accent")
            ?.trim() || (isDark ? "#82b6ff" : "#4b9eff"),
      },
      success: {
        main:
          getComputedStyle(document.documentElement)
            .getPropertyValue("--chip-success")
            ?.trim() || "#4caf50",
      },
      warning: {
        main:
          getComputedStyle(document.documentElement)
            .getPropertyValue("--chip-warning")
            ?.trim() || "#ffc107",
      },
      error: {
        main:
          getComputedStyle(document.documentElement)
            .getPropertyValue("--chip-error")
            ?.trim() || "#d84c4c",
      },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiPaper: { styleOverrides: { root: { borderColor: "var(--border)" } } },
      MuiDivider: {
        styleOverrides: { root: { borderColor: "var(--border)" } },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { background: "var(--topbar-bg)", color: "var(--topbar-fg)" },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
      MuiButton: {
        styleOverrides: { root: { textTransform: "none", borderRadius: 10 } },
      },
    },
  });
}

export default function ColorModeProvider({ children }) {
  const [mode, setMode] = useState("light");

  // On mount: read attribute already set by ThemeScript (or system)
  useEffect(() => {
    const htmlMode = document.documentElement.getAttribute("data-theme");
    setMode(htmlMode === "dark" ? "dark" : "light");
  }, []);

  // Keep data-theme + localStorage in sync
  const setAndPersist = (next) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("topbar-mode", next);
    } catch {}
    setMode(next);
  };

  // Listen for system changes if user hasn't explicitly chosen
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("topbar-mode")
        : null;
    if (saved) return; // user forced a mode
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e) => setAndPersist(e.matches ? "dark" : "light");
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      toggle: () => setAndPersist(mode === "light" ? "dark" : "light"),
      setMode: setAndPersist,
    }),
    [mode]
  );

  // Recompute MUI theme when mode changes (after first mount)
  const theme = useMemo(() => {
    if (typeof window === "undefined")
      return createTheme({ palette: { mode } });
    return makeTheme(mode);
  }, [mode]);

  return (
    <ColorModeCtx.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeCtx.Provider>
  );
}
