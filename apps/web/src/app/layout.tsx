import type { Metadata } from "next";
import { colors } from "@muslimspaces/ui";
import { Navbar } from "../components/Navbar/Navbar";

export const metadata: Metadata = {
  title: "MuslimSpaces",
  description:
    "Find mosques, halal restaurants, Islamic learning centers, and services for Muslims in Romania.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          backgroundColor: colors.background,
          color: colors.text,
        }}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
