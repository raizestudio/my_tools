// app/[short_code]/page.tsx
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ short_code: string }>;
}

export default async function RedirectPage({ params }: Props) {
  const { short_code } = await params;

  const apiUrl = process.env.API_URL || "http://localhost:8000";

  const res = await fetch(`${apiUrl}/url-shtnr/${short_code}`, {
    cache: "no-store", // Do not cache so clicks are counted every time
  });

  if (!res.ok) {
    notFound(); // Triggers your Next.js 404 page
  }

  const data = await res.json();

  // Instant server redirect to destination (e.g. google.com)
  redirect(data.original_url);
}
