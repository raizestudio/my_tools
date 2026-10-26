// app/components/secret/SecretCreateComponent.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { generateAesKey, exportKeyToBase64, encryptSecret } from '@/app/lib/crypto';
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";

export default function SecretCreateComponent() {
  const t = useTranslations('tools.secretShare');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState(3600); // 1h par défaut
  const [maxViews, setMaxViews] = useState(1);
  const [loading, setLoading] = useState(false);
  const [secretUrl, setSecretUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSecretUrl(null);

    try {
      // 1. Génération de la clé AES-256 dans le navigateur
      const key = await generateAesKey();
      const b64Key = await exportKeyToBase64(key);

      // 2. Chiffrement AES-GCM local
      const { ciphertext, iv } = await encryptSecret(content, key);

      // 3. Envoi du payload chiffré au backend
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
        throw new Error(t('serverError'));
      }

      const data = await res.json();

      // 4. Construction de l'URL préfixée par la locale avec la clé dans le hash (#)
      const shareUrl = `${window.location.origin}/${locale}/s/${data.id}#${b64Key}`;
      setSecretUrl(shareUrl);
      setContent('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('unexpectedError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!secretUrl) return;
    await navigator.clipboard.writeText(secretUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleReset = () => {
    setSecretUrl(null);
    setContent('');
    setError(null);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      {/* Header & Fil d'Ariane */}
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--shield-alert]"
        badge={
          <span className="badge badge-sm badge-soft badge-success">
            {t('zeroKnowledgeBadge')}
          </span>
        }
      />

      {/* Main Content Area */}
      {!secretUrl ? (
        <form onSubmit={handleCreate} className="card card-border bg-base-100 p-6 flex flex-col gap-6 shadow-sm">
          {/* Zone de texte */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-base-content/70">
              {t('messageLabel')}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('messagePlaceholder')}
              rows={7}
              required
              className="textarea textarea-bordered font-mono text-xs w-full resize-y focus:outline-primary leading-relaxed"
            />
          </div>

          {/* Options TTL & Lectures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-base-content/70">
                {t('expirationLabel')}
              </label>
              <select
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="select select-sm select-bordered w-full"
              >
                <option value={600}>{t('ttl10m')}</option>
                <option value={3600}>{t('ttl1h')}</option>
                <option value={86400}>{t('ttl24h')}</option>
                <option value={604800}>{t('ttl7d')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-base-content/70">
                {t('viewsLabel')}
              </label>
              <select
                value={maxViews}
                onChange={(e) => setMaxViews(Number(e.target.value))}
                className="select select-sm select-bordered w-full"
              >
                <option value={1}>{t('views1')}</option>
                <option value={2}>{t('views2')}</option>
                <option value={5}>{t('views5')}</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="alert alert-soft alert-error text-xs">
              <span className="icon-[lucide--alert-circle] size-4"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Bouton de soumission */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="btn btn-primary btn-sm gap-2 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner size-4"></span>
                  {t('encrypting')}
                </>
              ) : (
                <>
                  <span className="icon-[lucide--lock] size-4"></span>
                  {t('submit')}
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* État post-génération : Affichage du lien sécurisé */
        <div className="card card-border bg-base-100 p-6 flex flex-col gap-5 shadow-sm animate-in fade-in duration-200">
          <div className="alert alert-soft alert-success flex items-start gap-3 p-4">
            <span className="icon-[lucide--check-circle-2] size-5 text-success shrink-0 mt-0.5"></span>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-xs text-base-content">{t('successTitle')}</span>
              <span className="text-[11px] text-base-content/70 leading-normal">{t('successDesc')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-base-content/70">
              {t('urlLabel')}
            </label>
            <div className="flex items-center gap-2 bg-base-200/50 p-2 rounded-lg border border-base-content/10">
              <input
                type="text"
                readOnly
                value={secretUrl}
                className="bg-transparent font-mono text-xs flex-1 outline-none text-primary select-all px-2"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className={`btn btn-xs sm:btn-sm ${copied ? 'btn-success' : 'btn-primary'} gap-1.5 shrink-0`}
              >
                <span className={`icon-[lucide--${copied ? 'check' : 'copy'}] size-3.5`}></span>
                <span>{copied ? t('copied') : t('copy')}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-base-content/10">
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost btn-sm text-base-content/70 gap-1.5"
            >
              <span className="icon-[lucide--plus] size-4"></span>
              {t('newSecret')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
