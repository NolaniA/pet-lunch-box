"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { PawPrint } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { getSupabaseClient } from "@/utils/supabase/client";

export default function FormLogin({
  callbackError = false,
  authAvailable = true,
}: {
  callbackError?: boolean;
  authAvailable?: boolean;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    callbackError
      ? "This sign-in link could not be verified. Please sign in again."
      : "",
  );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authAvailable) return;
    const values = new FormData(event.currentTarget);
    const credentials = {
      email: String(values.get("email")).trim(),
      password: String(values.get("password")),
    };
    setBusy(true);
    setError("");
    try {
      const supabase = getSupabaseClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword(credentials);
        if (error) throw error;
        window.location.assign("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          ...credentials,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (data.session) {
          window.location.assign("/");
          return;
        }
        addToast({
          title: "Check your inbox",
          description:
            "If signup is available, you will receive a confirmation email.",
          color: "success",
        });
        setMode("login");
      }
    } catch (error) {
      setError(
        mode === "login"
          ? "Unable to sign in. Check your email and password, then try again."
          : error instanceof Error
            ? error.message
            : "Unable to create account.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function github() {
    if (!authAvailable) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      setError("Unable to connect to GitHub. Try email sign-in.");
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto grid max-w-4xl items-center gap-12 py-12 md:grid-cols-2 md:py-20">
      <div>
        <PawPrint aria-hidden size={36} className="mb-6 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          About Pet Lunch Box
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
          Your feeding routine,
          <br />
          managed in one place.
        </h1>
        <p className="mt-5 leading-relaxed text-default-500">
          Set daily feeding times and dispense duration for your own account.
          Your ESP32-C3 follows the schedule you save, helping you keep meals
          consistent on busy days.
        </p>
        <Link
          href="/firmware"
          className="mt-6 inline-block text-sm font-medium text-primary underline underline-offset-4"
        >
          Download open-source ESP32 firmware →
        </Link>
      </div>
      <div className="rounded-3xl border border-default-200 bg-content1 p-7 md:p-8">
        <h2 className="mb-6 text-xl font-semibold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        {!authAvailable ? (
          <p
            role="status"
            className="mb-5 rounded-xl bg-warning-50 p-3 text-sm text-warning-700"
          >
            Sign-in is temporarily unavailable. Please try again later. You can
            still learn about Pet Lunch Box and download the firmware.
          </p>
        ) : null}
        <form onSubmit={submit} className="space-y-5">
          <Input
            isRequired
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            variant="bordered"
          />
          <Input
            isRequired
            name="password"
            type="password"
            label="Password"
            minLength={mode === "register" ? 8 : 1}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            variant="bordered"
          />
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            color="primary"
            fullWidth
            isLoading={busy}
            isDisabled={!authAvailable}
          >
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-default-400">
          <span className="h-px flex-1 bg-default-200" />
          or
          <span className="h-px flex-1 bg-default-200" />
        </div>
        <Button
          fullWidth
          variant="bordered"
          isDisabled={busy || !authAvailable}
          onPress={github}
          startContent={<GithubIcon size={18} aria-hidden />}
        >
          Continue with GitHub
        </Button>
        <p className="mt-6 text-center text-sm text-default-500">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button
            type="button"
            disabled={busy}
            className="font-medium text-primary"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </section>
  );
}
