// app/components/landing/TypewriterTitleComponent.tsx
"use client";

import { useState, useEffect, useMemo } from "react";

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
  // Serialized key to detect prop changes during render
  const wordsKey = words.join("\0");
  const [prevWordsKey, setPrevWordsKey] = useState(wordsKey);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState(words[0] || "");
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. React Idiomatic Reset
  if (wordsKey !== prevWordsKey) {
    setPrevWordsKey(wordsKey);
    setCurrentWordIndex(0);
    setDisplayedText(words[0] || "");
    setIsDeleting(false);
  }

  // 2. Compute the longest phrase to permanently lock container height
  const longestWord = useMemo(() => {
    if (!words.length) return "";
    return words.reduce(
      (longest, w) => (w.length > longest.length ? w : longest),
      words[0]
    );
  }, [words]);

  // 3. Main Typewriter Loop
  useEffect(() => {
    if (!words.length) return;

    const safeIndex = currentWordIndex < words.length ? currentWordIndex : 0;
    const currentFullWord = words[safeIndex] || "";
    let timer: NodeJS.Timeout;

    if (!isDeleting && displayedText === currentFullWord) {
      timer = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else if (isDeleting && displayedText === "") {
      timer = setTimeout(() => {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }, emptyPause);
    } else {
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
    <h1 className="relative text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-base-content text-center max-w-4xl leading-[1.15] mb-4 min-h-[2.3em]">
      {/* Invisible In-Flow Ghost Sizer */}
      <span
        aria-hidden="true"
        className="invisible select-none pointer-events-none opacity-0 block"
      >
        <span>{prefix}&nbsp;</span>
        <span>{longestWord}</span>
        <span className="inline-block w-[3px] sm:w-[4px] h-[0.82em] ml-1.5" />
      </span>

      {/* Visible Active Typewriter */}
      <span className="absolute inset-0 w-full text-center">
        <span>{prefix}&nbsp;</span>
        <span className="inline-flex items-center align-baseline">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {displayedText || "\u200B"}
          </span>
          <span
            aria-hidden="true"
            className="inline-block w-[3px] sm:w-[4px] h-[0.82em] bg-primary ml-1.5 align-middle rounded-xs animate-pulse"
          />
        </span>
      </span>
    </h1>
  );
}
