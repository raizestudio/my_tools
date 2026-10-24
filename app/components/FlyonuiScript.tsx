// FlyonuiScript.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function FlyonuiScript() {
  const path = usePathname();

  useEffect(() => {
    const initFlyonUI = async () => {
      // 1. Dynamically import browser-only packages in the client
      const $ = (await import('jquery')).default;
      const _ = (await import('lodash')).default;
      const noUiSlider = (await import('nouislider')).default;
      await import('datatables.net');
      await import('dropzone/dist/dropzone-min.js');

      // 2. Attach them to the window object
      window.$ = $;
      window._ = _;
      window.jQuery = $;
      window.DataTable = ($.fn as unknown as { dataTable: unknown }).dataTable;
      window.noUiSlider = noUiSlider;

      // 3. Load FlyonUI core after dependencies are attached
      await import('flyonui/flyonui');

      // 4. Initialize components
      if (
        window.HSStaticMethods &&
        typeof window.HSStaticMethods.autoInit === 'function'
      ) {
        window.HSStaticMethods.autoInit();
      }
    };

    initFlyonUI();
  }, []);

  // Re-initialize FlyonUI components on route changes
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
