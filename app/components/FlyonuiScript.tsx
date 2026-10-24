// app/components/FlyonuiScript.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function FlyonuiScript() {
  const path = usePathname();

  useEffect(() => {
    const initFlyonUI = async () => {
      await import('flyonui/flyonui');
    };

    initFlyonUI();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        window.HSStaticMethods &&
        typeof window.HSStaticMethods.autoInit === 'function'
      ) {
        window.HSStaticMethods.autoInit();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [path]);

  return null;
}
