"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Link } from "@heroui/link";

const SettingApi = () => {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const apiUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/device?token=${deviceId}`;

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");
    };

    getUser();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const getDevice = async () => {
      const { data } = await supabase
        .from("user_data")
        .select("device_token")
        .eq("user_id", userId)
        .single();

      if (data?.device_token) {
        setDeviceId(data.device_token);
      }

      setLoading(false);
    };

    getDevice();
  }, [userId]);

  if (loading) return <LoadingSkeleton />;

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    addToast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
      color: "success",
    });
  };

  const refreshToken = async () => {
    const newToken = crypto.randomUUID();

    const { error } = await supabase
      .from("user_data")
      .update({ device_token: newToken })
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    setDeviceId(newToken);

    await navigator.clipboard.writeText(newToken);

    addToast({
      title: "Token refreshed!",
      description: "New device token generated",
      color: "success",
    });
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Device Settings</h1>
        <p className="text-sm">
          Manage ESP32 connection and API access
        </p>
      </div>

      {/* USER INFO */}
      {/* <Card className="shadow-sm">
        <CardBody className="space-y-2">
          <p className="text-sm ">Account</p>
          <p className="font-medium">{email}</p>
        </CardBody>
      </Card> */}

      {/* DEVICE TOKEN */}
      <Card className="shadow-md border">
        <CardBody className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="font-semibold">Device Token</p>
            {/* <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
              ACTIVE
            </span> */}
          </div>

          <div className="flex gap-2">
            <input
              className="w-full border rounded px-3 py-2 text-sm bg-background"
              value={deviceId}
              readOnly
            />

            <Button
              size="sm"
              color="warning"
              onClick={refreshToken}
            >
              Refresh
            </Button>
          </div>

          <p className="text-xs ">
            Use this token to connect your ESP32 device
          </p>
        </CardBody>
      </Card>

      {/* API URL */}
      <Card className="shadow-md border">
        <CardBody className="space-y-3">
          <p className="font-semibold">API Endpoint</p>

          <div className="flex gap-2">
            <input
              className="w-full border rounded px-3 py-2 text-sm bg-background"
              value={apiUrl}
              readOnly
            />

            <Button
              size="sm"
              onClick={() => copy(apiUrl, "API URL")}
            >
              Copy
            </Button>
          </div>

          <p className="text-xs ">
            ESP32 will call this endpoint to fetch schedule
          </p>
        </CardBody>
      </Card>
      {/* SOURCE CODE ESP32 */}
      <Card className="shadow-md border">
        <CardBody className="space-y-2">
          <p className="font-semibold">ESP32 Source Code</p>

          <p className="text-sm text-gray-500">
            Download firmware and connect your device to this system
          </p>

          <Link
            href="https://github.com/NolaniA/esp32c3-auto-feed/blob/gh-page/src/auto-feed-v3/auto-feed-v3.ino"
            target="_blank"
            className="text-blue-500 text-sm underline"
          >
            👉 View ESP32 Repository on GitHub
          </Link>
        </CardBody>
      </Card>

    </div>
  );
};

export default SettingApi;