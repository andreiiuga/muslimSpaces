import type { Metadata } from "next";
import { AboutView } from "../../components/AboutView/AboutView";

export const metadata: Metadata = {
  title: "About — MuslimSpaces",
  description: "Why MuslimSpaces exists and how it works.",
};

export default function AboutPage() {
  return <AboutView />;
}
