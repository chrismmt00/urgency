import "./globals.css";
import ThemeScript from "./ThemeScript";
import ColorModeProvider from "./providers/ColorModeProvider";

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
        <ThemeScript /> {/* sets data-theme before paint */}
      </head>
      <body>
        <ColorModeProvider>{children}</ColorModeProvider>
      </body>
    </html>
  );
}
