// app/components/landing/HeroAnimationWrapper.tsx
"use client";

import { motion } from "motion/react";
import React from "react";

export default function HeroAnimationWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1], // Custom smooth spring curve
        staggerChildren: 0.1,
      }}
      className="flex flex-col items-center w-full relative z-10"
    >
      {React.Children.map(children, (child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex justify-center"
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
