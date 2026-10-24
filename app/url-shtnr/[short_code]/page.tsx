// app/url-shtnr/[short_code]/page.tsx
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ short_code: string }>;
}

async function RedirectHandler({
  params,
}: {
  params: Promise<{ short_code: string }>;
}): Promise<React.ReactNode> {
  const { short_code } = await params;
  const apiUrl = process.env.API_URL || 'http://localhost:8000';

  let originalUrl: string | null = null;

  try {
    const res = await fetch(`${apiUrl}/url-shtnr/${short_code}`);

    if (!res.ok) {
      notFound();
    }

    const data = await res.json();
    originalUrl = data.original_url;
  } catch {
    notFound();
  }

  if (originalUrl) {
    redirect(originalUrl);
  }

  notFound();
  return null;
}

function RedirectFallback() {
  return (
    <div className="flex flex-col items-center justify-center grow p-6 gap-3">
      <span className="icon-[lucide--loader-2] size-8 animate-spin text-primary"></span>
      <p className="text-base-content/70 text-sm">Redirection en cours...</p>
    </div>
  );
}

export default function RedirectPage({ params }: PageProps) {
  return (
    <Suspense fallback={<RedirectFallback />}>
      <RedirectHandler params={params} />
    </Suspense>
  );
}
