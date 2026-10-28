"use client";

import { useRef, useState, type KeyboardEvent } from "react";

const methods = [
  { id: "arduino", label: "Arduino IDE" },
  { id: "platformio", label: "PlatformIO (Python)" },
] as const;
type InstallMethod = (typeof methods)[number]["id"];

export default function InstallationGuide() {
  const [method, setMethod] = useState<InstallMethod>("arduino");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % methods.length;
    else if (event.key === "ArrowLeft")
      next = (index + methods.length - 1) % methods.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = methods.length - 1;
    else return;
    event.preventDefault();
    setMethod(methods[next].id);
    tabs.current[next]?.focus();
  }

  return (
    <section className="mt-10 space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Build and install</h2>
        <p className="mt-2 text-sm leading-7 text-default-500">
          Choose the upload tool you prefer. Both methods install the same
          firmware.
        </p>
      </div>
      <div
        role="tablist"
        aria-label="Firmware installation method"
        className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-default-200 bg-content1 p-1"
      >
        {methods.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            id={`install-tab-${item.id}`}
            role="tab"
            type="button"
            aria-selected={method === item.id}
            aria-controls={`install-panel-${item.id}`}
            tabIndex={method === item.id ? 0 : -1}
            onClick={() => setMethod(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${method === item.id ? "bg-primary text-primary-foreground" : "text-default-500 hover:bg-default-100"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        id="install-panel-arduino"
        role="tabpanel"
        aria-labelledby="install-tab-arduino"
        tabIndex={0}
        hidden={method !== "arduino"}
        className="rounded-2xl border border-default-200 bg-content1 p-5 md:p-6"
      >
        <p className="mb-5 text-sm leading-7 text-default-500">
          Use Arduino IDE to upload the source directly. No Python setup is
          required for this method.
        </p>
        <ol className="list-decimal space-y-4 pl-5 text-sm leading-7">
          <li>Download the source ZIP above and unzip it.</li>
          <li>
            In Arduino IDE, install{" "}
            <strong>esp32 by Espressif Systems 2.0.17</strong> from Boards
            Manager.
          </li>
          <li>
            Install <strong>ArduinoJson 6.21.5</strong> from Library Manager.
          </li>
          <li>
            Open{" "}
            <code className="break-all text-primary">
              firmware/esp32c3/esp32c3.ino
            </code>{" "}
            from the extracted folder. Keep all adjacent source files together.
          </li>
          <li>
            Select your ESP32-C3 board and USB port, then click{" "}
            <strong>Upload</strong>.
          </li>
          <li>
            Open Serial Monitor at <strong>115200 baud</strong> to see the setup
            Wi-Fi details.
          </li>
        </ol>
      </div>
      <div
        id="install-panel-platformio"
        role="tabpanel"
        aria-labelledby="install-tab-platformio"
        tabIndex={0}
        hidden={method !== "platformio"}
        className="min-w-0 rounded-2xl border border-default-200 bg-content1 p-5 md:p-6"
      >
        <p className="text-sm leading-7 text-default-500">
          Python installs the PlatformIO tools on your computer. The ESP still
          runs the same Arduino/C++ firmware.
        </p>
        <p className="mt-3 text-sm leading-7 text-default-500">
          Unzip the download and open a terminal in the extracted
          pet-lunch-box-esp32c3 folder:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-default-50 p-4 text-sm">
          <code>
            {
              "python -m pip install -r firmware/requirements.txt\npio run -d firmware\npio run -d firmware -t upload\npio device monitor -d firmware"
            }
          </code>
        </pre>
        <p className="mt-4 text-sm leading-7 text-default-500">
          PlatformIO installs the pinned board tools and library versions from
          the included configuration.
        </p>
      </div>
    </section>
  );
}
