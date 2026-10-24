// app/components/FlyonuiScript.tsx
'use client';

import { useEffect } from 'react';

export default function FlyonuiScript() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let observer: MutationObserver | null = null;

    const runAutoInit = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (
          window.HSStaticMethods &&
          typeof window.HSStaticMethods.autoInit === 'function'
        ) {
          window.HSStaticMethods.autoInit();
        }
      }, 100);
    };

    const initFlyonUI = async () => {
      await import('flyonui/flyonui');
      runAutoInit();

      // Automatically re-run autoInit when Next.js swaps routes or updates DOM
      observer = new MutationObserver(() => {
        runAutoInit();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };

    initFlyonUI();

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, []);

  return null;
}
