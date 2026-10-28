"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import Link from "next/link";
import { Copy, KeyRound, BookOpen, Cpu } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function SettingApi() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [confirmRotation, setConfirmRotation] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setOrigin(window.location.origin);
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Unable to load settings.");
        setToken(data.device_token);
        setEmail(data.email);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Unable to load settings.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [retry]);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      addToast({ title: "Copied to clipboard", color: "success" });
    } catch {
      addToast({
        title: "Copy unavailable",
        description: "Select the field and copy it manually.",
        color: "warning",
      });
    }
  }

  async function rotate() {
    setRotating(true);
    setError("");
    try {
      const response = await fetch("/api/settings", { method: "POST" });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to rotate token.");
      setToken(data.device_token);
      setConfirmRotation(false);
      addToast({
        title: "Token replaced",
        description: "Update the token in your feeder’s setup portal.",
        color: "success",
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to rotate token.",
      );
    } finally {
      setRotating(false);
    }
  }

  return (
    <section
      className="mx-auto max-w-3xl space-y-6 py-6 md:py-12"
      aria-busy={loading}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Connected care
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Your device settings
        </h1>
        <p className="mt-3 text-default-500">
          Manage the connection settings for your signed-in account.
        </p>
      </div>
      {loading ? <p role="status">Loading device settings…</p> : null}
      {error ? (
        <div
          role="alert"
          className="rounded-2xl bg-danger-50 p-4 text-sm text-danger"
        >
          {error}{" "}
          <button
            className="ml-2 underline"
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      ) : null}
      <div className="rounded-3xl border border-default-200 bg-content1 p-6 md:p-8">
        <KeyRound aria-hidden className="mb-4 h-6 w-6 text-primary" />
        <h2 className="text-lg font-semibold">Device credentials</h2>
        <p className="mt-1 text-sm text-default-500">{email}</p>
        <div className="mt-6 flex items-end gap-2">
          <Input
            readOnly
            label="API endpoint"
            labelPlacement="outside"
            value={origin ? `${origin}/api/device` : ""}
          />
          <Button
            isIconOnly
            aria-label="Copy API endpoint"
            isDisabled={!origin}
            onPress={() => copy(`${origin}/api/device`)}
          >
            <Copy size={17} aria-hidden />
          </Button>
        </div>
        <div className="mt-6 flex items-end gap-2">
          <Input
            readOnly
            type="password"
            label="Device token"
            labelPlacement="outside"
            value={token}
          />
          <Button
            isIconOnly
            aria-label="Copy device token"
            isDisabled={!token}
            onPress={() => copy(token)}
          >
            <Copy size={17} aria-hidden />
          </Button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-default-500">
          Enter the endpoint and token separately in the setup portal. Keep your
          token private; it allows access to your feeding schedule.
        </p>
        <div className="mt-6 border-t border-default-200 pt-5">
          {confirmRotation ? (
            <div className="space-y-3">
              <p className="text-sm">
                Replace this token? The current token will stop working.
                Reconfigure your feeder after replacing it.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="danger"
                  isLoading={rotating}
                  onPress={rotate}
                >
                  Replace token
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={rotating}
                  onPress={() => setConfirmRotation(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="flat"
              isDisabled={loading || !token}
              onPress={() => setConfirmRotation(true)}
            >
              Replace device token
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/docs"
          className="rounded-2xl border border-default-200 bg-content1 p-6 transition hover:border-primary"
        >
          <BookOpen aria-hidden className="mb-3 text-primary" />
          <h2 className="font-semibold">Connection guide</h2>
          <p className="mt-2 text-sm text-default-500">
            From flashing the board to your first scheduled meal.
          </p>
        </Link>
        <a
          href={siteConfig.links.firmware}
          className="rounded-2xl border border-default-200 bg-content1 p-6 transition hover:border-primary"
        >
          <Cpu aria-hidden className="mb-3 text-primary" />
          <h2 className="font-semibold">Open-source ESP32-C3 firmware</h2>
          <p className="mt-2 text-sm text-default-500">
            Download the public source and install it on your own ESP32-C3.
          </p>
        </a>
      </div>
    </section>
  );
}
