import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "MuslimSpaces",
  description:
    "Find mosques, halal restaurants, Islamic learning centers, and services for Muslims in Romania.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
