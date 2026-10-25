'use client';

import { useState } from 'react';
import { generateAesKey, exportKeyToBase64, encryptSecret } from '@/app/lib/crypto';

export default function SecretCreateComponent() {
  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState(3600); // 1 hour default
  const [maxViews, setMaxViews] = useState(1);
  const [loading, setLoading] = useState(false);
  const [secretUrl, setSecretUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);
    setSecretUrl(null);

    try {
      // 1. Generate AES-256 key locally
      const key = await generateAesKey();
      const b64Key = await exportKeyToBase64(key);

      // 2. Encrypt locally
      const { ciphertext, iv } = await encryptSecret(content, key);

      // 3. Send encrypted payload to FastAPI
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciphertext,
          iv,
          ttl_seconds: ttl,
          max_views: maxViews,
        }),
      });

      if (!res.ok) {
        throw new Error('Échec de la création du secret sur le serveur.');
      }

      const data = await res.json();

      // 4. Construct URL with key in the hash fragment (#)
      const shareUrl = `${window.location.origin}/s/${data.id}#${b64Key}`;
      setSecretUrl(shareUrl);
      setContent('');
    } catch (err: any) {
      setError(err?.message || 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!secretUrl) return;
    await navigator.clipboard.writeText(secretUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card bg-base-200 border border-base-300 shadow-xl max-w-2xl mx-auto w-full">
      <div className="card-body gap-5 p-4 sm:p-8">

        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="icon-[lucide--shield-alert] text-primary size-6"></span>
            Partage de Secret Chiffré
          </h2>
          <p className="text-xs text-base-content/70 mt-1">
            Chiffrement AES-GCM 256 bits côté client. La clé réside dans le fragment d'URL et n'est jamais transmise au serveur.
          </p>
        </div>

        {!secretUrl ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">Message ou informations d'identification</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Collez ici vos identifiants, tokens d'API ou notes confidentielles..."
                rows={6}
                required
                className="textarea textarea-bordered font-mono text-xs w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold">Expiration</label>
                <select
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  className="select select-sm select-bordered"
                >
                  <option value={600}>10 minutes</option>
                  <option value={3600}>1 heure</option>
                  <option value={86400}>24 heures</option>
                  <option value={604800}>7 jours</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold">Nombre de lectures autorisées</label>
                <select
                  value={maxViews}
                  onChange={(e) => setMaxViews(Number(e.target.value))}
                  className="select select-sm select-bordered"
                >
                  <option value={1}>1 lecture (Autodestruction immédiate)</option>
                  <option value={2}>2 lectures</option>
                  <option value={5}>5 lectures</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="alert alert-soft alert-error text-xs">
                <span className="icon-[lucide--alert-circle] size-4"></span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="btn btn-primary mt-2"
            >
              {loading ? (
                <>
                  <span className="icon-[lucide--loader-2] size-4 animate-spin"></span>
                  Chiffrement en cours...
                </>
              ) : (
                'Générer le lien sécurisé'
              )}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="alert alert-soft alert-success text-xs">
              <span className="icon-[lucide--check-circle] size-4"></span>
              <span>Le secret a été chiffré et le payload enregistré.</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold">Lien de déchiffrement unique :</span>
              <div className="flex items-center gap-2 bg-base-100 p-2.5 rounded-lg border border-base-300">
                <input
                  type="text"
                  readOnly
                  value={secretUrl}
                  className="bg-transparent font-mono text-xs flex-1 outline-none text-primary truncate"
                />
                <button
                  onClick={copyToClipboard}
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
                >
                  <span className={copied ? 'icon-[lucide--check] size-4' : 'icon-[lucide--copy] size-4'}></span>
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setSecretUrl(null)}
              className="btn btn-ghost btn-sm self-start mt-2"
            >
              Créer un autre secret
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
