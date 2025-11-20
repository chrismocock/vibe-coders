"use client";

import { motion } from "framer-motion";
import { Lightbulb, Palette, Code2, Rocket } from "lucide-react";

const steps = [
  {
    title: "Ideate",
    description: "Describe your idea and what you want to build.",
    icon: Lightbulb,
  },
  {
    title: "Design",
    description: "We sketch a clean UI with modern patterns.",
    icon: Palette,
  },
  {
    title: "Build",
    description: "We generate an MVP with best-practice code.",
    icon: Code2,
  },
  {
    title: "Launch",
    description: "Deploy to Vercel or export your code.",
    icon: Rocket,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-white md:text-4xl">How it works</h2>
        <p className="mt-2 text-white/70">Four guided steps to go from idea to app.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <step.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-medium text-white">{step.title}</h3>
            </div>
            <p className="mt-3 text-sm text-white/80">{step.description}</p>
            <div className="mt-4">
              <a
                href="#signup"
                className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
              >
                Try this step
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}


