// app/not-found.tsx
import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-base-100 text-base-content flex items-center justify-center p-4">
        <div className="card card-border bg-base-200/40 border-base-content/10 max-w-md w-full p-8 rounded-3xl text-center flex flex-col items-center gap-5">
          <div className="badge badge-soft badge-error font-mono text-xs font-bold px-3 py-1.5 rounded-full">
            404 // UNKNOWN_LOCALE_OR_ROUTE
          </div>

          <h1 className="text-3xl font-black font-mono tracking-tight">
            Invalid Route
          </h1>

          <p className="text-xs sm:text-sm text-base-content/70">
            The requested address does not map to any supported locale or tool
            pathway.
          </p>

          <Link
            href="/en"
            className="btn btn-primary btn-sm font-semibold rounded-xl px-5 mt-2"
          >
            Go to English Console
          </Link>
        </div>
      </body>
    </html>
  );
}
