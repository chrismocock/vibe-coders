import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { SignupForm } from "@/components/SignupForm";

export default function Home() {
  return (
    <div className="relative mx-auto max-w-7xl space-y-16 px-6 py-12 md:space-y-24 md:py-20">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#0b1220]" />
      <Hero />
      <HowItWorks />
      <SignupForm />
    </div>
  );
}
