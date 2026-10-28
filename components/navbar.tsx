"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { PawPrint } from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";
import AvatarPopover from "@/components/avatar-popover";
import { siteConfig } from "@/config/site";
import { getSupabaseClient } from "@/utils/supabase/client";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseClient();
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null),
    );
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const navItems = user ? siteConfig.navItems : siteConfig.publicNavItems;
  const isActive = (href: string) =>
    pathname === href || (!user && pathname === "/" && href === "/about");
  return (
    <header className="sticky top-0 z-40 border-b border-default-200 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="rounded-xl bg-primary/10 p-2 text-primary">
            <PawPrint size={20} aria-hidden />
          </span>
          Pet Lunch Box
        </Link>
        <div className="flex items-center gap-3 sm:order-last">
          <ThemeSwitch />
          {user ? (
            <AvatarPopover userData={user} />
          ) : (
            <Link href="/login" className="text-sm font-medium text-primary">
              Sign in
            </Link>
          )}
        </div>
        <nav
          aria-label="Main navigation"
          className="order-last flex w-full flex-wrap gap-1 sm:order-none sm:w-auto"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm transition ${isActive(item.href) ? "bg-primary/10 font-medium text-primary" : "text-default-500 hover:bg-default-100"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
