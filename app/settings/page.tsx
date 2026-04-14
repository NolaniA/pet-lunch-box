"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";
import LoadingSkeleton from "@/components/LoadingSkeleton";

const Setting = () => {
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (user) {
        setLoading(false)
        setUserId(user.id);
        setEmail(user.email || "");
      }
    };

    getUser();
  }, [router]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(userId);

    addToast({
      title: "Copied!",
      description: "User ID copied to clipboard",
      color: "success",
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-10 px-4">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-xl font-bold">Settings</h2>

          {/* Email */}
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{email}</p>
          </div>

          {/* User ID */}
          <div>
            <p className="text-sm text-gray-500">User ID (API Key)</p>
            <div className="flex gap-2 items-center">
              <input className="w-full border rounded px-2 py-1 text-sm" value={userId} readOnly />
              <Button size="sm" onClick={copyToClipboard}>
                Copy
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500">Use this User ID to connect your device (ESP32) to the API.</div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Setting;
