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
  // Côté navigateur : après le premier chargement, on renvoie null
  // pour que React 19 ne voie aucun <script> lors des navigations client.
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
