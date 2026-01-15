export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Pet Lunch Shit",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "Home",
      href: "/",
    }
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    }
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
