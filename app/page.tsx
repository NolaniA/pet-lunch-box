import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import FormInput from "@/components/form";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Pet &nbsp;</span>
        <span className={title({ color: "violet" })}>Lunch</span>
        <span className={title()}>Box&nbsp;</span>
        <br />
        <span className={title()}>
          {/* websites regardless of your design experience. */}
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          {/* Beautiful, fast and modern React UI library. */}
        </div>
      </div>

      <FormInput />

    </section>
  );
}
