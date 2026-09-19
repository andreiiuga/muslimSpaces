import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import { colors } from "@muslimspaces/ui";
import { Navbar } from "../components/Navbar/Navbar";
import { Footer } from "../components/Footer/Footer";
import { LocaleProvider } from "../i18n/LocaleContext";
import "./globals.css";

// Same font stack as the design's own CSS (`"Plus Jakarta Sans","IBM Plex
// Sans Arabic",system-ui,...`) — Plus Jakarta Sans has no Arabic glyphs, so
// the browser falls back to IBM Plex Sans Arabic per-glyph automatically
// for Arabic-script text, same mechanism relied on (minus the second font,
// which isn't worth a native asset there) in the mobile app's fonts.ts.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});
const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MuslimSpaces",
  description:
    "Find mosques, halal restaurants, Islamic learning centers, and services for Muslims in Romania.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${ibmArabic.variable}`}>
      <body
        style={{
          margin: 0,
          fontFamily: "var(--font-jakarta), var(--font-ibm-arabic), system-ui, sans-serif",
          backgroundColor: colors.background,
          color: colors.text,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <LocaleProvider>
          <Navbar />
          {/* minWidth: 0 is load-bearing — a flex item's default min-width
              is "auto" (its content's intrinsic width), so without this any
              wide-content page (Explore's map+list columns, a long table,
              etc.) forces this wrapper — and therefore the whole page body —
              wider than the viewport instead of the content shrinking or
              scrolling within itself. */}
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
