"use client";
import { IDataConfig } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { Form, Button, Alert, Skeleton } from "@heroui/react";
import { useEffect, useState } from "react";
import InputField from "./InputField";
import { ClockIcon } from "./icons";
import { i } from "framer-motion/m";
import LoadingSkeleton from "./LoadingSkeleton";

function validateField(field: "hour" | "minute" | "duration_sec", value: number): string | null {
  if (Number.isNaN(value)) return "Invalid number";
  switch (field) {
    case "hour":
      if (value < 0 || value > 23) return "Hour 0 to 23";
      break;
    case "minute":
      if (value < 0 || value > 59) return "0 to 59";
      break;
    case "duration_sec":
      if (value < 0 || value > 60) return "feed time 0 to 60";
      break;
  }
  return null;
}

export default function FormInput() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [configTimeData, setConfigTimeData] = useState<IDataConfig[] | []>([]);
  const [successPopup, setSuccessPopup] = useState(false);

  useEffect(() => {
    const getDataTime = async () => {
      const { data } = await supabase.from("config-time").select("*").order("id");

      if (data) {
        setConfigTimeData(data as IDataConfig[]);
      }
    };

    getDataTime();
  }, []);

  const updateRow = (index: number, field: keyof IDataConfig, value: number) => {
    setSuccessPopup(false);
    setConfigTimeData((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

    const error = validateField(field as any, value);
    setErrors((prev) => {
      const key = `${index}.${field}`;
      if (error) return { ...prev, [key]: error };

      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const onSubmit = async () => {
    const { error } = await supabase.from("config-time").upsert(configTimeData, { onConflict: "id" });

    if (error) {
      console.error(error);
      return;
    }
    setSuccessPopup(true);
  };

  return (
    <Form
      className="mx-auto self-stretch items-center relative space-y-1"
      validationErrors={errors}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {configTimeData.length == 0 ? (
        <LoadingSkeleton />
      ) : (
        <>
          {configTimeData?.map((data, i) => (
            <div key={i} className="w-full max-w-md flex justify-between gap-2 md:gap-5 items-center">
              <div className="w-24 whitespace-nowrap inline-flex justify-center items-center gap-2 mb-1.5">
                <span className="block aspect-square h-6">
                  <ClockIcon />
                </span>
                {i + 1}
              </div>
              <InputField rowIndex={i} field="hour" label="hour" value={data.hour} max={23} error={errors[`${i}.hour`]} onChange={(v) => updateRow(i, "hour", v)} />
              <InputField rowIndex={i} field="minute" label="minute" value={data.minute} max={59} error={errors[`${i}.minute`]} onChange={(v) => updateRow(i, "minute", v)} />
              <InputField rowIndex={i} field="duration_sec" label="duration (s)" value={data.duration_sec} max={60} error={errors[`${i}.duration_sec`]} onChange={(v) => updateRow(i, "duration_sec", v)} />
            </div>
          ))}
          <Button type="submit" variant="flat" isDisabled={Object.keys(errors).length > 0}>
            Submit
          </Button>
        </>
      )}

      {successPopup && <Alert isClosable onClose={() => setSuccessPopup(false)} className="absolute z-50 top-20" color="success" description={"success update"} variant="faded" />}
    </Form>
  );
}
