"use client";

import { useState } from "react";
import { Button, Card, CardBody, Input } from "@heroui/react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { addToast, ToastProvider } from "@heroui/toast";
import { GithubIcon } from "@/components/icons";
import { useEffect } from "react";
import { div } from "framer-motion/m";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "active" | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [providerLoading, setProviderLoading] = useState<string | null>(null); // oauth
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      setLoading(true);
      if (data.session) {
        setMode("active");
        setLoading(true);
        router.push("/");
      } else {
        setMode("login");
        setLoading(false);
      }
    };

    checkSession();
  }, [loading, router]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (mode === "login") {
      // 🔐 LOGIN
      try{
        // setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          addToast({
            title: "Login fail",
            description: "Email or Password incorrect",
            color: "warning",
          });
          return;
        }

        addToast({
          title: "Login success 🎉",
          description: "Welcome back!",
          color: "success",
        });

        window.location.replace("/");
        setMode("login");

      }catch(err) {
        addToast({
          title: "Error",
          description: "Something went wrong",
          color: "danger",
        });

      }finally {
        setLoading(false);
      }

    } else {

      try{
        // setLoading(true);

        // 🆕 REGISTER
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });

        console.log(data);


        if (error) {
          if (error?.code === "over_email_send_rate_limit") {
            addToast({
              title: "Too many requests",
              description: "Please wait a moment before trying again.",
              color: "warning",
            });
          } else if (error) {
            addToast({
              title: "Something went wrong",
              description: error.message || "Please try again later.",
              color: "danger",
            });
          }
          return;
        }

        if (!data.user?.identities?.length) {
          addToast({
            title: "User already exists",
            description: "Please login instead",
            color: "warning",
          });
          return;
        }

        addToast({
          title: "Check your email 📩",
          description: "Please confirm your signup",
          color: "success",
        });

      }catch(err) {
        addToast({
          title: "Error",
          description: "Something went wrong",
          color: "danger",
        });

      }finally {
        setLoading(false);
      }




    }
  };

  const handleOAuthLogin = async (provider: "github" | "google") => {
    setProviderLoading(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // redirectTo: `https://misoza.vercel.app/auth/callback`,
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      addToast({
        title: "Login social fail",
        description: error.message,
        color: "warning",
      });
      setProviderLoading(null);
    }
  };

  if (loading) {
    // return <div/>;
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex container max-w-7xl justify-center items-center">
      <Card style={{ width: 400 }}>
        <CardBody>
          <form onSubmit={onSubmit} className="w-full space-y-8  p-6 ">
            <h1 className="text-xl font-semibold text-center">{mode === "login" ? "Login" : "Register"}</h1>

            <Input isRequired name="email" type="email" label="Email" labelPlacement="outside" fullWidth placeholder="Enter your email" />

            <Input isRequired name="password" type="password" label="Password" labelPlacement="outside" fullWidth placeholder="Enter your password" />

            <Button type="submit" className="w-full bg-[#90EE90]" isLoading={loading} isDisabled={loading || providerLoading !== null}>
              {mode === "login" ? "Login" : "Register"}
            </Button>

            {/* 🔁 toggle */}
            <p className="text-sm text-center">
              {mode === "login" ? "No account?" : "Already have an account?"}
              <button type="button" className="cursor-pointer ml-1 text-blue-500 underline " onClick={() => setMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Register" : "Login"}
              </button>
            </p>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>

              <span className="mx-2 text-sm  px-2">or</span>

              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <Button className="w-full bg-[#5a32a3] text-white hover:bg-[#6f42c1]" type="button" onClick={() => handleOAuthLogin("github")} isLoading={providerLoading === "github"}>
              <div className="flex items-center justify-center gap-2">
                <GithubIcon className="h-5 w-5" />
                <span>Connect With GitHub</span>
              </div>
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
