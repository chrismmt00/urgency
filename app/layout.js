"use client";
import "./globals.css";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
