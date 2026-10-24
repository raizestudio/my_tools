'use client';

import { useState } from 'react';

interface ShortenResult {
  short_code: string;
  short_url: string;
  original_url: string;
}

export default function UrlShtnr() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    // Basic client validation
    let formattedUrl = url.trim();
    if (!formattedUrl) return;

    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/url-shtnr/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formattedUrl,
          custom_code: customCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Erreur lors de la réduction du lien.');
      }

      setResult(data);
      setUrl('');
      setCustomCode('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur inattendue est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result?.short_url) return;
    await navigator.clipboard.writeText(result.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-center items-center grow p-4">
      <div className="flex flex-col items-center gap-6 max-w-xl w-full">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-base-content text-4xl font-extrabold tracking-tight">
            URL Shortener
          </h1>
          <p className="text-base-content/70 text-sm">
            Raccourcissez vos URLs avec <span className="font-semibold text-primary">0w.lat</span>
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="https://mon-lien-tres-long.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="input input-filled flex-1"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <span className="icon-[lucide--loader-2] size-4 animate-spin"></span>
                  Génération...
                </>
              ) : (
                'Générer'
              )}
            </button>
          </div>

          {/* Optional Vanity / Custom Code */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-base-content/60 whitespace-nowrap">
              Slug personnalisé (optionnel) :
            </span>
            <input
              type="text"
              placeholder="ex: portfolio"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              className="input input-sm input-filled flex-1"
            />
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="alert alert-soft alert-error w-full text-sm">
            <span className="icon-[lucide--alert-circle] size-5"></span>
            <span>{error}</span>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="card card-border bg-base-100 shadow-sm w-full p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-xs font-medium text-base-content/60">
              Lien raccourci créé avec succès :
            </span>

            <div className="flex items-center justify-between gap-3 bg-base-200/50 rounded-lg p-3 border border-base-content/10">
              <a
                href={result.short_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline truncate flex items-center gap-1.5"
              >
                {result.short_url}
                <span className="icon-[lucide--external-link] size-3.5 opacity-70"></span>
              </a>

              <button
                type="button"
                onClick={copyToClipboard}
                className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              >
                {copied ? (
                  <>
                    <span className="icon-[lucide--check] size-4"></span>
                    Copié !
                  </>
                ) : (
                  <>
                    <span className="icon-[lucide--copy] size-4"></span>
                    Copier
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-base-content/50 truncate">
              Cible : {result.original_url}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
