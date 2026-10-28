import type { Metadata } from "next";
import AboutContent from "@/components/AboutContent";

export const metadata: Metadata = {
  title: "About",
  description:
    "Plan your pet’s daily meals, manage your own feeding schedule and connect an ESP32-C3 with open-source firmware.",
};

export default function AboutPage() {
  return <AboutContent />;
}
