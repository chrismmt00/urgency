import "./globals.css";
import ThemeScript from "./ThemeScript";
import ThemeRegistry from "./ThemeRegistry";
import ColorModeProvider from "./providers/ColorModeProvider";
import { AuthProvider } from "./providers/AuthProvider";
import AppClientRoot from "./components/AppClientRoot";

export const metadata = {
  title: "Urgency",
  description: "Tame your inbox — one tick at a time.",
};

// Ensure proper mobile scaling and full-bleed rendering on modern devices
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeRegistry>
          <ColorModeProvider>
            <AuthProvider>
              <AppClientRoot>{children}</AppClientRoot>
            </AuthProvider>
          </ColorModeProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
