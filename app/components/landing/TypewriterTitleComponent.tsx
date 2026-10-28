// app/components/landing/TypewriterTitleComponent.tsx
"use client";

import { useState, useEffect } from "react";

interface TypewriterTitleProps {
  prefix: string;
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  emptyPause?: number;
}

export default function TypewriterTitleComponent({
  prefix,
  words,
  typingSpeed = 70,
  deletingSpeed = 30,
  pauseDuration = 2200,
  emptyPause = 350,
}: TypewriterTitleProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState(words[0] || "");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words.length) return;

    const currentFullWord = words[currentWordIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting && displayedText === currentFullWord) {
      // 1. Finished typing current word -> hold before deleting
      timer = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else if (isDeleting && displayedText === "") {
      // 2. Finished deleting -> pause calmly on empty before typing next word
      timer = setTimeout(() => {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }, emptyPause);
    } else {
      // 3. Typing or deleting characters
      const speed = isDeleting ? deletingSpeed : typingSpeed;
      timer = setTimeout(() => {
        setDisplayedText((prev) =>
          isDeleting
            ? currentFullWord.slice(0, prev.length - 1)
            : currentFullWord.slice(0, prev.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [
    displayedText,
    isDeleting,
    currentWordIndex,
    words,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    emptyPause,
  ]);

  return (
    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-base-content text-center max-w-4xl leading-[1.15] mb-4">
      <span>{prefix}&nbsp;</span>
      <span className="inline-flex items-center align-baseline">
        <span
          className={`bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent transition-opacity duration-150 ${
            displayedText ? "opacity-100" : "opacity-0"
          }`}
        >
          {displayedText || "\u00A0"}
        </span>
        {/* Terminal blinking cursor */}
        <span
          aria-hidden="true"
          className="inline-block w-[3px] sm:w-[4px] h-[0.82em] bg-primary ml-1.5 align-middle rounded-xs animate-pulse"
        />
      </span>
    </h1>
  );
}
