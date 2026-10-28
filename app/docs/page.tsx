import Link from "next/link";

const steps = [
  {
    title: "Create your account",
    text: "Sign up and confirm your email, or sign in with your existing account. Your schedule and device token belong to your account.",
  },
  {
    title: "Set your feeding schedule",
    text: "Add up to 10 daily meals with an hour, minute and dispense duration. Times use Asia/Bangkok (UTC+7). Save the schedule. A duration of 0 pauses a meal; an empty schedule pauses all meals.",
  },
  {
    title: "Install the open-source firmware",
    text: "Download the ESP32-C3 firmware from the Firmware page and install it on your board using the included instructions. The same firmware is available to everyone. The original GPIO9 servo pin is preserved.",
  },
  {
    title: "Copy your connection settings",
    text: "Open your Device page and copy the API endpoint and your personal device token. These credentials let your ESP fetch the schedule for your account.",
  },
  {
    title: "Connect your ESP",
    text: "On first boot, join the PetLunchBox-XXXX setup Wi-Fi using the password printed in Serial Monitor at 115200 baud. Open 192.168.4.1 and enter your Wi-Fi name, Wi-Fi password, API endpoint and personal device token. Save to restart the board.",
  },
  {
    title: "Check your routine",
    text: "Your ESP fetches the saved schedule every 5 minutes while connected. Check Serial Monitor for a successful update and supervise the first meal to calibrate the dispense duration for your feeder.",
  },
];

export default function DocsPage() {
  return (
    <article className="mx-auto max-w-3xl py-10 md:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Your account. Your routine.
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Connect your feeder to your account
      </h1>
      <p className="mt-4 leading-relaxed text-default-500">
        Use this website to manage your own feeding schedule. Install the public
        firmware on your ESP and link it using your personal connection
        settings.
      </p>
      <ol className="mt-10 space-y-8">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </span>
            <div className="min-w-0 break-words">
              <h2 className="font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm leading-7 text-default-500">
                {step.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <aside className="mt-10 rounded-2xl border border-default-200 bg-content1 p-6">
        <h2 className="font-semibold">
          Changing Wi-Fi or your personal token?
        </h2>
        <p className="mt-2 text-sm leading-7 text-default-500">
          Send SETUP followed by a newline over Serial Monitor to reopen the ESP
          setup portal. Replacing a token on your Device page only affects your
          account. Enter the new token on your ESP to reconnect it.
        </p>
        <div className="mt-4 flex flex-wrap gap-5 text-sm font-medium text-primary">
          <Link href="/settings">Your device settings →</Link>
          <Link href="/firmware">Download firmware →</Link>
        </div>
      </aside>
    </article>
  );
}
