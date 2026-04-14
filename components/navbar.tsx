"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Link } from "@heroui/link";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  Logo,
} from "@/components/icons";
import {Avatar} from "@heroui/avatar";
import { Button } from "@heroui/button";
import { supabase } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@/types/user";
import AvatarPopover from "./avartar-popover";


export const Navbar = () => {
  const [user, setUser] = useState<User | undefined>(undefined)

  useEffect(() => {
    if(!user){

      const getUser = async () =>{

        const { data } = await supabase.auth.getUser();
        setUser(data.user as User);
      };
      getUser();
    }
  }, [])
  // }, [user])



  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">PET LUNCHBOX</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-4 items-center" >

          <ThemeSwitch />
          {user?.email && <AvatarPopover userData={user}/>}

        </NavbarItem>
        <NavbarItem className="hidden md:flex">

        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">

        <ThemeSwitch />
        {user?.email && <AvatarPopover userData={user}/>}
      </NavbarContent>

    </HeroUINavbar>
  );
};

