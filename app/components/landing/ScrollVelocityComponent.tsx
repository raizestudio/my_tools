// app/components/landing/ScrollVelocityComponent.tsx
"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
} from "motion/react";

interface ScrollVelocityProps {
  texts: string[];
  baseVelocity?: number;
  className?: string;
}

export default function ScrollVelocityComponent({
  texts,
  baseVelocity = 3,
  className = "",
}: ScrollVelocityProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);
  const directionFactor = useRef<number>(1);

  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  // 4 duplicates ensure seamless infinite wrapping between -20% and -45%
  const repetitions = [0, 1, 2, 3];

  return (
    <div
      className={`overflow-hidden m-0 whitespace-nowrap flex flex-nowrap select-none py-4 ${className}`}
    >
      <motion.div
        className="flex whitespace-nowrap gap-6 sm:gap-8 text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter font-mono"
        style={{ x }}
      >
        {repetitions.map((repIdx) => (
          <div key={repIdx} className="flex items-center gap-6 sm:gap-8 shrink-0">
            {texts.map((word, wordIdx) => (
              <span key={wordIdx} className="inline-flex items-center gap-6 sm:gap-8">
                <span className="text-base-content/25 hover:text-primary hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer inline-block">
                  {word}
                </span>
                <span className="text-base-content/15 select-none text-xl sm:text-2xl">
                  •
                </span>
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function wrap(min: number, max: number, v: number) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}
