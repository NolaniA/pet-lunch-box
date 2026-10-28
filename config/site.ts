export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Pet Lunch Box",
  description:
    "Manage your feeding schedule and connect your own ESP32-C3 with open-source firmware.",
  publicNavItems: [
    { label: "About", href: "/about" },
    { label: "Firmware", href: "/firmware" },
  ],
  navItems: [
    { label: "Schedule", href: "/" },
    { label: "Device", href: "/settings" },
    { label: "Firmware", href: "/firmware" },
    { label: "Guide", href: "/docs" },
  ],
  links: {
    github: "https://github.com/NolaniA/pet-lunch-box",
    firmware: "/firmware",
    firmwareSource: "https://github.com/NolaniA/esp32c3-auto-feed",
    firmwareDownload: "/downloads/pet-lunch-box-esp32c3-source.zip",
    docs: "/docs",
  },
};
