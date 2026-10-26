// app/components/jwt/JwtInspectorComponent.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';

function decodeBase64Url(str: string): string {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error('Base64URL invalide');
  }
}

async function verifyHmac(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  secret: string,
  alg: string
): Promise<boolean> {
  const hashAlgorithms: Record<string, string> = {
    HS256: 'SHA-256',
    HS384: 'SHA-384',
    HS512: 'SHA-512',
  };

  const hashName = hashAlgorithms[alg];
  if (!hashName || !secret) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: { name: hashName } },
      false,
      ['verify']
    );

    let b64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const sigBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      sigBytes[i] = binary.charCodeAt(i);
    }

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    return await crypto.subtle.verify('HMAC', key, sigBytes, data);
  } catch {
    return false;
  }
}

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIERldmVsb3BlciIsImFkbWluIjp0cnVlLCJpYXQiOjE3MzAwMDAwMDAsImV4cCI6MTk5OTk5OTk5OX0.5G_B1pfnGgqV3549Hn_YhM9JvhX_6sZ8rU-O4U0k5gY';

export default function JwtInspectorComponent() {
  const locale = useLocale();
  const isFr = locale === 'fr';

  const [tokenInput, setTokenInput] = useState(SAMPLE_JWT);
  const [secretKey, setSecretKey] = useState('');
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [signatureStatus, setSignatureStatus] = useState<boolean | null>(null);
  const [nowSec, setNowSec] = useState<number | null>(null);

  useEffect(() => {
    setNowSec(Math.floor(Date.now() / 1000));
    const timer = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp * 1000);
    if (nowSec === null) {
      return d.toISOString();
    }
    return d.toLocaleString(isFr ? 'fr-FR' : 'en-US');
  };

  const cleanToken = tokenInput.trim().replace(/^Bearer\s+/i, '');
  const parts = cleanToken.split('.');
  const isThreeParts = parts.length === 3;
  const [headerB64, payloadB64, signatureB64] = parts;

  const decodedData = useMemo(() => {
    if (!isThreeParts) return null;

    let parsedHeader: Record<string, unknown> | null = null;
    let parsedPayload: Record<string, unknown> | null = null;
    let error: string | null = null;

    try {
      parsedHeader = JSON.parse(decodeBase64Url(headerB64));
    } catch {
      error = isFr ? 'En-tête JWT invalide' : 'Invalid JWT Header';
    }

    try {
      parsedPayload = JSON.parse(decodeBase64Url(payloadB64));
    } catch {
      error = isFr ? 'Charge utile (payload) invalide' : 'Invalid JWT Payload';
    }

    return { parsedHeader, parsedPayload, error };
  }, [headerB64, payloadB64, isThreeParts, isFr]);

  useEffect(() => {
    let isCancelled = false;

    if (!isThreeParts || !secretKey || !decodedData?.parsedHeader) {
      setSignatureStatus(null);
      return;
    }

    const alg = String(decodedData.parsedHeader.alg || '');
    if (!alg.startsWith('HS')) {
      setSignatureStatus(null);
      return;
    }

    verifyHmac(headerB64, payloadB64, signatureB64, secretKey, alg).then((isValid) => {
      if (!isCancelled) setSignatureStatus(isValid);
    });

    return () => {
      isCancelled = true;
    };
  }, [headerB64, payloadB64, signatureB64, secretKey, decodedData, isThreeParts]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(label);
    setTimeout(() => setIsCopied(null), 1800);
  };

  const exp = typeof decodedData?.parsedPayload?.exp === 'number' ? decodedData.parsedPayload.exp : null;
  const iat = typeof decodedData?.parsedPayload?.iat === 'number' ? decodedData.parsedPayload.iat : null;
  const nbf = typeof decodedData?.parsedPayload?.nbf === 'number' ? decodedData.parsedPayload.nbf : null;

  const isExpired = exp !== null && nowSec !== null ? nowSec > exp : false;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-base-content/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-xs text-base-content/60 hover:text-primary transition-colors">
              {isFr ? 'Outils' : 'Tools'}
            </Link>
            <span className="text-xs text-base-content/30">/</span>
            <span className="text-xs text-primary font-medium">JWT Inspector</span>
          </div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2.5">
            <span className="icon-[lucide--key-round] size-6 text-primary"></span>
            {isFr ? 'Inspecteur & Décodeur JWT' : 'JWT Inspector & Debugger'}
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            {isFr
              ? 'Décodage et inspection 100 % hors ligne. Aucun jeton n’est transmis au réseau.'
              : 'Zero-knowledge inspection. Tokens are decoded client-side and never leave your browser.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setTokenInput(SAMPLE_JWT)}
            className="btn btn-xs btn-outline"
          >
            {isFr ? 'Charger un exemple' : 'Load sample'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTokenInput('');
              setSecretKey('');
            }}
            className="btn btn-xs btn-ghost text-base-content/60"
          >
            {isFr ? 'Effacer' : 'Clear'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Raw Input */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="card card-border bg-base-100 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                {isFr ? 'Jeton encodé (Raw JWT)' : 'Encoded Token (Raw JWT)'}
              </label>
              <span className="badge badge-xs badge-soft badge-success">Local only</span>
            </div>

            <textarea
              rows={8}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="eyJhbGciOi..."
              className="textarea textarea-bordered font-mono text-xs w-full resize-y focus:outline-primary"
            />

            {isThreeParts && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-base-content/10">
                <span className="text-[11px] font-medium text-base-content/60">
                  {isFr ? 'Structure identifiée :' : 'Identified segments:'}
                </span>
                <div className="p-3 bg-base-200/50 rounded-md font-mono text-xs break-all leading-relaxed">
                  <span className="text-error font-medium">{headerB64}</span>
                  <span className="text-base-content/40">.</span>
                  <span className="text-secondary font-medium">{payloadB64}</span>
                  <span className="text-base-content/40">.</span>
                  <span className="text-info font-medium">{signatureB64}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card card-border bg-base-100 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                {isFr ? 'Vérifier la signature' : 'Verify Signature'}
              </label>
              {signatureStatus === true && (
                <span className="badge badge-sm badge-success text-xs">
                  {isFr ? 'Signature valide' : 'Signature verified'}
                </span>
              )}
              {signatureStatus === false && (
                <span className="badge badge-sm badge-error text-xs">
                  {isFr ? 'Signature invalide' : 'Invalid signature'}
                </span>
              )}
            </div>

            <p className="text-[11px] text-base-content/60">
              {decodedData?.parsedHeader?.alg && String(decodedData.parsedHeader.alg).startsWith('HS')
                ? isFr
                  ? `Algorithme détecté : ${decodedData.parsedHeader.alg}. Saisissez votre clé secrète partagée.`
                  : `Detected ${decodedData.parsedHeader.alg}. Enter the shared secret below.`
                : isFr
                ? 'La vérification locale instantanée prend en charge les signatures HMAC (HS256, HS384, HS512).'
                : 'Instant client-side verification supports HMAC (HS256, HS384, HS512).'}
            </p>

            <input
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="your-256-bit-secret"
              disabled={!decodedData?.parsedHeader?.alg?.toString().startsWith('HS')}
              className="input input-sm input-bordered font-mono text-xs w-full"
            />
          </div>
        </div>

        {/* Right Column: Decoded Payload & Header */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {!isThreeParts && cleanToken.length > 0 && (
            <div className="alert alert-soft alert-warning text-xs">
              <span className="icon-[lucide--alert-circle] size-4"></span>
              <span>
                {isFr
                  ? 'Un JWT valide doit comporter 3 segments séparés par des points (Header.Payload.Signature).'
                  : 'A valid JWT must contain 3 segments separated by dots (Header.Payload.Signature).'}
              </span>
            </div>
          )}

          {decodedData?.error && (
            <div className="alert alert-soft alert-error text-xs">
              <span className="icon-[lucide--alert-triangle] size-4"></span>
              <span>{decodedData.error}</span>
            </div>
          )}

          {/* Expiration Banner */}
          {exp !== null && nowSec !== null && (
            <div
              className={`p-3.5 rounded-lg border flex items-center justify-between text-xs ${
                isExpired
                  ? 'bg-error/10 border-error/20 text-error'
                  : 'bg-success/10 border-success/20 text-success'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`${
                    isExpired ? 'icon-[lucide--clock-alert]' : 'icon-[lucide--check-circle-2]'
                  } size-4.5 shrink-0`}
                ></span>
                <div>
                  <span className="font-semibold mr-1">
                    {isExpired
                      ? isFr
                        ? 'Jeton expiré :'
                        : 'Token expired:'
                      : isFr
                      ? 'Jeton actif :'
                      : 'Token active:'}
                  </span>
                  <span suppressHydrationWarning>{formatDate(exp)}</span>
                </div>
              </div>
              <span className="font-mono text-[11px] opacity-80">
                {Math.abs(Math.round((exp - nowSec) / 60))}{' '}
                {isFr ? 'min restantes/passées' : 'mins delta'}
              </span>
            </div>
          )}

          {/* Header */}
          <div className="card card-border bg-base-100 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-error"></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content">
                  Header
                </span>
                <span className="text-[11px] text-base-content/50">
                  ({String(decodedData?.parsedHeader?.alg || 'Algorithme')})
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(decodedData?.parsedHeader, null, 2),
                    'header'
                  )
                }
                className="btn btn-xs btn-ghost text-base-content/60"
              >
                {isCopied === 'header'
                  ? isFr
                    ? 'Copié !'
                    : 'Copied!'
                  : isFr
                  ? 'Copier JSON'
                  : 'Copy JSON'}
              </button>
            </div>

            <pre className="p-3 bg-base-200/50 rounded-md font-mono text-xs overflow-x-auto text-base-content/90">
              {decodedData?.parsedHeader
                ? JSON.stringify(decodedData.parsedHeader, null, 2)
                : isFr
                ? '// En attente d’un en-tête valide...'
                : '// Waiting for valid header...'}
            </pre>
          </div>

          {/* Payload */}
          <div className="card card-border bg-base-100 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-secondary"></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content">
                  Payload
                </span>
                <span className="text-[11px] text-base-content/50">
                  ({isFr ? 'Données & Droits' : 'Claims'})
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(decodedData?.parsedPayload, null, 2),
                    'payload'
                  )
                }
                className="btn btn-xs btn-ghost text-base-content/60"
              >
                {isCopied === 'payload'
                  ? isFr
                    ? 'Copié !'
                    : 'Copied!'
                  : isFr
                  ? 'Copier JSON'
                  : 'Copy JSON'}
              </button>
            </div>

            <pre className="p-3 bg-base-200/50 rounded-md font-mono text-xs overflow-x-auto text-base-content/90">
              {decodedData?.parsedPayload
                ? JSON.stringify(decodedData.parsedPayload, null, 2)
                : isFr
                ? '// En attente d’un payload valide...'
                : '// Waiting for valid payload...'}
            </pre>

            {/* Claims RFC 7519 */}
            {decodedData?.parsedPayload && (
              <div className="mt-3 pt-3 border-t border-base-content/10 flex flex-col gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-base-content/50 uppercase">
                  Claims RFC 7519
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  {iat !== null && (
                    <div className="bg-base-200/30 p-2 rounded">
                      <span className="text-base-content/50 block">iat (Issued At):</span>
                      <span suppressHydrationWarning>{formatDate(iat)}</span>
                    </div>
                  )}
                  {nbf !== null && (
                    <div className="bg-base-200/30 p-2 rounded">
                      <span className="text-base-content/50 block">nbf (Not Before):</span>
                      <span suppressHydrationWarning>{formatDate(nbf)}</span>
                    </div>
                  )}
                  {Boolean(decodedData.parsedPayload.iss) && (
                    <div className="bg-base-200/30 p-2 rounded col-span-full">
                      <span className="text-base-content/50 block">iss (Issuer):</span>
                      <span className="break-all">{String(decodedData.parsedPayload.iss)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
