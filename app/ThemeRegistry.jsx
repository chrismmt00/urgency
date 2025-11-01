"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import CssBaseline from "@mui/material/CssBaseline";

export default function ThemeRegistry({ children }) {
  // Provide a stable Emotion cache per request for App Router
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <CssBaseline />
      {children}
    </AppRouterCacheProvider>
  );
}
