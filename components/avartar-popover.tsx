"use client";

import { Popover, PopoverTrigger, PopoverContent, Button, Input, Avatar, Card, CardBody } from "@heroui/react";
import { User } from "@/types/user";
import { supabase } from "@/utils/supabase/client";
import { siteConfig } from "@/config/site";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface IMobilePopover {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userData: AvatarPopoverProps["userData"];
}

type AvatarPopoverProps = {
  userData: User;
};

export default function AvatarPopover({ userData }: AvatarPopoverProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);

  return (
    <>
      <MobilePopover open={ mobileOpen } setOpen={ setMobileOpen } userData={userData} />
      <Popover showArrow offset={10} placement="bottom" className="hidden md:flex relative w-fit" isOpen={ desktopOpen } onOpenChange={ setDesktopOpen }>
        <PopoverTrigger >
          {userData?.email && (
            <Avatar
              onClick={() => {
              if (window.innerWidth < 768) {
                setMobileOpen(true);
              }
            }}
              className=""
              name={userData?.email.charAt(0)}
              size="md"
            />
          )}
        </PopoverTrigger>
        <PopoverContent className="w-[240px] left-5">
          {(titleProps) => (
            <div className="px-1 py-2 w-full">
              <p className="text-small font-bold text-foreground" {...titleProps}>
                {userData?.email}
              </p>
              <div className="relative mb-4 flex items-center pt-3">
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <ul className="flex flex-col gap-3 mb-4">
                {siteConfig.navItems.map((item) => (
                  <Link
                    key={item.href}
                    className="text-foreground hover:text-primary transition"
                    href={item.href}
                    onClick={() => setDesktopOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </ul>
              <div className="relative mb-4 flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <div className="mt-2 relative flex flex-col gap-2 w-full">
                <Button
                  color="danger"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.replace("/login");
                  }}
                >
                  Sign out
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}

export const MobilePopover: React.FC<IMobilePopover> = ({ open, setOpen, userData }) => {
  const router = useRouter();

  return (
    <>
      {open && (
        <div className="inset-0 fixed h-screen flex z-[100] md:hidden bg-background justify-center items-start pt-5">
          <div className="w-full max-w-md mx-auto bg-background rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <Button size="sm" onClick={() => setOpen(false)}>X</Button>
              <p className="text-small font-bold">{userData?.email}</p>
            </div>
            <div className="relative mb-4 flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <ul className="flex flex-col gap-3 mb-4">
              {siteConfig.navItems.map((item) => (
                <Link
                  key={item.href}
                  className="text-foreground hover:text-primary transition"
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </ul>
            <div className="relative mb-4 flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center items-center" >
              <Button
                color="danger"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.replace("/login");
                }}
                >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
