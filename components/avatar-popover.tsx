"use client";

import type { User } from "@supabase/supabase-js";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";
import { useState } from "react";
import { addToast } from "@heroui/toast";
import { getSupabaseClient } from "@/utils/supabase/client";

export default function AvatarPopover({ userData }: { userData: User }) {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) throw error;
      window.location.assign("/login");
    } catch {
      addToast({ title: "Unable to sign out. Try again.", color: "danger" });
      setBusy(false);
    }
  }
  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Button
          isIconOnly
          aria-label="Open account menu"
          variant="flat"
          radius="full"
          color="primary"
        >
          {userData.email?.charAt(0).toUpperCase() || "P"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-72 items-stretch gap-3 p-4">
        <p className="break-all text-sm">{userData.email}</p>
        <Button
          size="sm"
          variant="flat"
          color="danger"
          isLoading={busy}
          onPress={signOut}
        >
          Sign out
        </Button>
      </PopoverContent>
    </Popover>
  );
}
