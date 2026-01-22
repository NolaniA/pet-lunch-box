import FormInput from "@/components/form";
import { title } from "@/components/primitives";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Pet &nbsp;</span>
        <span className={title({ color: "violet" })}>Lunch</span>
        <span className={title()}>Box&nbsp;</span>
      </div>
      <FormInput />
    </section>
  );
}
