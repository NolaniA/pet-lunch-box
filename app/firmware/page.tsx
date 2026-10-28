import type { Metadata } from "next";
import InstallationGuide from "@/components/firmware/InstallationGuide";
import { Download, Code2, Cpu, KeyRound } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Open-source firmware" };

export default function FirmwarePage() {
  return (
    <article className="mx-auto max-w-3xl py-10 md:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Open-source · ESP32-C3
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Firmware for your own feeder
      </h1>
      <p className="mt-4 leading-relaxed text-default-500">
        Download the source, build it and install it on your ESP32-C3. Everyone
        uses the same firmware; your personal API endpoint and device token
        connect it to your account.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <a
          href={siteConfig.links.firmwareDownload}
          download
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
        >
          <Download size={17} aria-hidden />
          Download source ZIP
        </a>
        <a
          href={siteConfig.links.firmwareSource}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-default-200 px-5 py-3 text-sm font-medium"
        >
          <Code2 size={17} aria-hidden />
          Original source on GitHub
        </a>
      </div>
      <p className="mt-3 text-xs text-default-500">
        The source download is public. No account or personal credentials are
        included in the archive.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-default-200 bg-content1 p-6">
          <Cpu className="mb-3 text-primary" size={22} aria-hidden />
          <h2 className="font-semibold">Original hardware pin</h2>
          <p className="mt-2 text-sm leading-7 text-default-500">
            The servo stays on GPIO9. Keep your existing wiring. The source
            includes the setup portal, schedule client and motor control.
          </p>
        </section>
        <section className="rounded-2xl border border-default-200 bg-content1 p-6">
          <KeyRound className="mb-3 text-primary" size={22} aria-hidden />
          <h2 className="font-semibold">Connect your own account</h2>
          <p className="mt-2 text-sm leading-7 text-default-500">
            After flashing, enter your Wi-Fi credentials and the connection
            settings from your Device page. Your ESP reads only the schedule
            associated with your token.
          </p>
        </section>
      </div>
      <InstallationGuide />
    </article>
  );
}
