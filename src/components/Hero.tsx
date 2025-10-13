"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md md:p-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-20%,rgba(59,130,246,0.35),transparent_60%),radial-gradient(800px_400px_at_10%_120%,rgba(192,38,211,0.35),transparent_60%),radial-gradient(800px_400px_at_90%_120%,rgba(34,197,94,0.35),transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="mx-auto max-w-3xl text-center"
      >
        <h1 className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-semibold tracking-[-0.02em] text-transparent md:text-6xl">
          Turn your vibe into code.
        </h1>
        <p className="mt-5 text-balance text-base text-white/80 md:text-lg">
          Vibe Coders guides you from idea to app — no coding required.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href="#signup"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-gray-900 shadow-lg transition hover:shadow-xl"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 backdrop-blur-md transition hover:bg-white/10"
          >
            How it works
          </a>
        </div>
      </motion.div>
    </section>
  );
}


