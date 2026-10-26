// app/s/[id]/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { importKeyFromBase64, decryptSecret } from '@/app/lib/crypto';

function SecretRevealContent() {
  const params = useParams();
  const id = params?.id as string;

  const [revealed, setRevealed] = useState(false);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [viewsRemaining, setViewsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReveal = async () => {
    if (!id) {
      setError("Identifiant du secret manquant.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) {
        throw new Error("Clé de déchiffrement absente de l'URL. Le lien est incomplet.");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/secrets/${id}`);

      if (res.status === 404) {
        throw new Error("Ce secret n'existe pas ou a déjà expiré / été détruit.");
      }
      if (!res.ok) {
        throw new Error('Erreur lors de la récupération du secret.');
      }

      const data = await res.json();

      const cryptoKey = await importKeyFromBase64(hash);
      const decrypted = await decryptSecret(data.ciphertext, data.iv, cryptoKey);

      setPlaintext(decrypted);
      setViewsRemaining(data.views_remaining);
      setRevealed(true);
    } catch (err: any) {
      setError(err?.message || 'Impossible de déchiffrer le secret.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!plaintext) return;
    await navigator.clipboard.writeText(plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center grow">
      <div className="card bg-base-200 border border-base-300 shadow-xl max-w-lg w-full">
        <div className="card-body gap-5 p-6 sm:p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-3">
              <span className="icon-[lucide--lock] size-6"></span>
            </div>
            <h1 className="text-xl font-bold">Secret Sécurisé</h1>
            <p className="text-xs text-base-content/60 mt-1">
              Un message chiffré vous a été transmis.
            </p>
          </div>

          {!revealed ? (
            <div className="flex flex-col gap-4">
              <div className="bg-warning/10 border border-warning/20 text-warning-content p-4 rounded-xl text-xs flex items-start gap-3">
                <span className="icon-[lucide--alert-triangle] text-warning size-5 shrink-0 mt-0.5"></span>
                <span>
                  L'affichage de ce secret consommera un droit de lecture. Si le message est configuré pour une lecture unique, il sera immédiatement détruit du serveur.
                </span>
              </div>

              {error && (
                <div className="alert alert-soft alert-error text-xs">
                  <span className="icon-[lucide--alert-circle] size-4"></span>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleReveal}
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <>
                    <span className="icon-[lucide--loader-2] size-4 animate-spin"></span>
                    Déchiffrement...
                  </>
                ) : (
                  'Révéler le secret'
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center text-xs">
                <span className="text-base-content/70">Contenu déchiffré :</span>
                {viewsRemaining !== null && (
                  <span className="badge badge-sm badge-soft badge-info font-mono">
                    {viewsRemaining === 0 ? 'Détruit sur le serveur' : `${viewsRemaining} vue(s) restante(s)`}
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={plaintext || ''}
                  rows={6}
                  className="textarea textarea-bordered font-mono text-xs w-full bg-base-100 select-all"
                />
              </div>

              <button
                onClick={copyToClipboard}
                className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'} w-full gap-2`}
              >
                <span className={copied ? 'icon-[lucide--check] size-4' : 'icon-[lucide--copy] size-4'}></span>
                {copied ? 'Copié dans le presse-papiers' : 'Copier le contenu'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SecretRevealPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center grow p-12">
          <span className="icon-[lucide--loader-2] size-8 animate-spin text-primary"></span>
        </div>
      }
    >
      <SecretRevealContent />
    </Suspense>
  );
}
