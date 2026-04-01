"use client";

import { supabase } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import FormInput from "../form";
import { title } from "@/components/primitives";


const SettingTimerForm = () => {
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        redirect("/login");
      }
    };

    checkUser();
  }, []);
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Pet &nbsp;</span>
        <span className={title({ color: "violet" })}>Lunch</span>
        <span className={title()}>Box&nbsp;</span>
      </div>
      <FormInput />
    </section>
  );
};
export default SettingTimerForm;
