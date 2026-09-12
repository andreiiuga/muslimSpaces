import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
