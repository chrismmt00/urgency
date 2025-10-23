"use client";
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    background: { default: "#F5F6F7" }, // neutral base
    text: { primary: "#2E3134", secondary: "#5E6367" },
    primary: { main: "#5E6367" }, // slate gray for UI
    success: { main: "#9BBF9B" }, // green (on time)
    warning: { main: "#E4C97C" }, // amber (mid)
    error: { main: "#D84C4C" }, // urgent/red
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", borderRadius: 12 } },
    },
  },
});
