import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  icons: { icon: "/favicon.ico" },
  referrer: "no-referrer",
};
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#101815" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers
          themeProps={{
            attribute: "class",
            defaultTheme: "system",
            enableSystem: true,
          }}
        >
          <div className="flex min-h-screen flex-col">
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4"
            >
              Skip to content
            </a>
            <Navbar />
            <main
              id="main"
              className="mx-auto w-full max-w-6xl flex-1 px-5 md:px-8"
            >
              {children}
            </main>
            <footer className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-3 border-t border-default-200 px-5 py-6 text-xs text-default-500 md:px-8">
              <span>Pet Lunch Box · Built for a little everyday care.</span>
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                Source on GitHub ↗
              </a>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
