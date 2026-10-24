// app/components/FlyonuiScript.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function FlyonuiInit() {
  const path = usePathname();

  // Load FlyonUI once on initial mount
  useEffect(() => {
    const initFlyonUI = async () => {
      await import('flyonui/flyonui');
    };

    initFlyonUI();
  }, []);

  // Re-run autoInit whenever the client route changes
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

export default function FlyonuiScript() {
  return (
    <Suspense fallback={null}>
      <FlyonuiInit />
    </Suspense>
  );
}
