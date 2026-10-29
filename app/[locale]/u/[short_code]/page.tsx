// app/[locale]/u/[short_code]/page.tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

// Next.js 16 Cache Components: exempts this route from Instant Navigation prerender checks
export const instant = false;

interface PageProps {
  params: Promise<{ locale: string; short_code: string }>;
}

export const metadata: Metadata = {
  title: "Redirecting...",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RedirectPage({ params }: PageProps) {
  const { short_code } = await params;
  const apiUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  let originalUrl: string | null = null;

  try {
    const res = await fetch(
      `${apiUrl}/url-shtnr/${encodeURIComponent(short_code)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (res.ok) {
      const data = await res.json();
      originalUrl = data.original_url;
    }
  } catch {
    // Backend unreachable -> drop to notFound()
  }

  if (
    originalUrl &&
    (originalUrl.startsWith("http://") || originalUrl.startsWith("https://"))
  ) {
    redirect(originalUrl);
  }

  notFound();
}
