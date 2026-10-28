import Link from "next/link";
import { CalendarClock, SlidersHorizontal, Cpu, PawPrint } from "lucide-react";

const benefits = [
  {
    icon: CalendarClock,
    title: "Keep meals consistent",
    description:
      "Plan up to 10 meals a day with a feeding time and dispense duration for each meal. Build a routine that fits your pet.",
  },
  {
    icon: SlidersHorizontal,
    title: "Manage your own settings",
    description:
      "Your schedule and device token belong to your account. Adjust meal times and portions from your phone or computer.",
  },
  {
    icon: Cpu,
    title: "Use your own ESP32-C3",
    description:
      "Install the public, open-source firmware on your feeder. Connect it to your account using your personal device token.",
  },
];

export default function AboutContent() {
  return (
    <article className="mx-auto max-w-5xl py-10 md:py-16">
      <div className="max-w-3xl">
        <span className="mb-6 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <PawPrint size={30} aria-hidden />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          About Pet Lunch Box
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          A daily feeding routine,
          <br className="hidden sm:block" /> built around your pet.
        </h1>
        <p className="mt-6 text-lg leading-8 text-default-500">
          Pet Lunch Box helps you set feeding times and dispense duration for
          your own account. Your ESP32-C3 feeder follows the schedule you save,
          helping you keep meals consistent on busy days.
        </p>
        <p className="mt-4 leading-7 text-default-500">
          Manage the routine from your browser and use the open-source firmware
          on your own hardware. You can explore the firmware before creating an
          account.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            Sign in to get started
          </Link>
          <Link
            href="/firmware"
            className="rounded-xl border border-default-200 px-5 py-3 text-sm font-medium"
          >
            Explore the firmware
          </Link>
        </div>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {benefits.map(({ icon: Icon, title, description }) => (
          <section
            key={title}
            className="rounded-2xl border border-default-200 bg-content1 p-6"
          >
            <Icon className="mb-4 text-primary" size={23} aria-hidden />
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-default-500">
              {description}
            </p>
          </section>
        ))}
      </div>
      <section className="mt-12 rounded-3xl border border-default-200 bg-content1 p-6 md:p-8">
        <h2 className="text-xl font-semibold">
          From your account to their bowl
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Create your routine",
              description:
                "Sign in and save the daily feeding schedule for your pet.",
            },
            {
              title: "Install the firmware",
              description:
                "Download the source and upload it to your ESP32-C3 with Arduino IDE or PlatformIO.",
            },
            {
              title: "Connect your feeder",
              description:
                "Enter your Wi-Fi and personal device token in the ESP setup portal.",
            },
          ].map((step, index) => (
            <li key={step.title}>
              <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <h3 className="font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-default-500">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-6 border-t border-default-200 pt-5 text-xs leading-6 text-default-500">
          Your ESP checks for schedule updates every 5 minutes while online.
          Feeding times use Bangkok time (UTC+7).
        </p>
      </section>
    </article>
  );
}
