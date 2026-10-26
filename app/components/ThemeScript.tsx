// app/components/ThemeScript.tsx
"use client";

let hasMounted = false;

const THEME_INIT_SCRIPT = `(function() {
  try {
    var saved = localStorage.getItem('theme');
    var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();`;

export default function ThemeScript() {
  if (typeof window !== "undefined") {
    if (hasMounted) return null;
    hasMounted = true;
  }

  return (
    <script
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      suppressHydrationWarning
    />
  );
}
