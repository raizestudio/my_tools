'use client';

import { useState, useRef, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

type Mode = 'url' | 'wifi' | 'text';
type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

// Limites physiques maximales d'un QR code (Version 40 en mode binaire)
const QR_MAX_BYTES: Record<ErrorLevel, number> = {
  L: 2950, // Faible (~7% de récupération)
  M: 2330, // Moyenne (~15% de récupération)
  Q: 1660, // Quartile (~25% de récupération)
  H: 1270, // Haute (~30% de récupération)
};

export default function QrCodeGeneratorComponent() {
  const [mode, setMode] = useState<Mode>('wifi');

  // URL / Plain Text State
  const [textContent, setTextContent] = useState('https://0w.lat');

  // Wi-Fi Specific State
  const [ssid, setSsid] = useState('MyHomeWifi');
  const [password, setPassword] = useState('');
  const [authType, setAuthType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [isHidden, setIsHidden] = useState(false);

  // Customization State
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('M');
  const [size, setSize] = useState(256);
  const [includeMargin, setIncludeMargin] = useState(true);

  const qrRef = useRef<HTMLDivElement>(null);

  // Format Wi-Fi standard ZXing
  const getWifiString = () => {
    const escapeWifi = (str: string) => str.replace(/([\\;,:"])/g, '\\$1');
    const escapedSsid = escapeWifi(ssid);
    const escapedPass = escapeWifi(password);
    const hiddenStr = isHidden ? 'H:true;' : '';

    if (authType === 'nopass') {
      return `WIFI:T:nopass;S:${escapedSsid};${hiddenStr};`;
    }
    return `WIFI:T:${authType};S:${escapedSsid};P:${escapedPass};${hiddenStr};`;
  };

  const qrValue = mode === 'wifi' ? getWifiString() : textContent;

  // Calcul réel de la taille en octets (gère les accents et caractères multi-octets)
  const byteLength = useMemo(() => {
    return new TextEncoder().encode(qrValue).length;
  }, [qrValue]);

  const maxAllowedBytes = QR_MAX_BYTES[errorLevel];
  const isTooLong = byteLength > maxAllowedBytes;

  const downloadPng = () => {
    if (isTooLong || !qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `qr-${mode}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    if (isTooLong) return;
    window.print();
  };

  return (
    <div className="card bg-base-200 border border-base-300 shadow-xl max-w-5xl mx-auto w-full">
      <div className="card-body gap-6 p-4 sm:p-8">

        {/* Header */}
        <div className="border-b border-base-300 pb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="icon-[lucide--qr-code] text-primary size-7"></span>
            Générateur de QR Code & Carte Wi-Fi
          </h2>
          <p className="text-xs text-base-content/70 mt-1">
            Générez des QR codes sécurisés directement dans votre navigateur sans envoyer vos données à un serveur.
          </p>
        </div>

        {/* Content Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('wifi')}
            className={`btn btn-sm ${mode === 'wifi' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <span className="icon-[lucide--wifi] size-4"></span>
            Accès Wi-Fi
          </button>
          <button
            onClick={() => setMode('url')}
            className={`btn btn-sm ${mode === 'url' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <span className="icon-[lucide--link] size-4"></span>
            Lien URL
          </button>
          <button
            onClick={() => setMode('text')}
            className={`btn btn-sm ${mode === 'text' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <span className="icon-[lucide--file-text] size-4"></span>
            Texte libre
          </button>
        </div>

        {/* 2-Columns layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Controls Column */}
          <div className="lg:col-span-7 flex flex-col gap-5">

            {/* Mode-specific Fields */}
            {mode === 'wifi' ? (
              <div className="space-y-4 bg-base-100 p-4 rounded-xl border border-base-300">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold">Nom du réseau (SSID)</label>
                  <input
                    type="text"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="MonRéseauBox"
                    className="input input-sm input-bordered w-full font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold">Sécurité</label>
                    <select
                      value={authType}
                      onChange={(e) => setAuthType(e.target.value as any)}
                      className="select select-sm select-bordered w-full"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Aucun (Réseau ouvert)</option>
                    </select>
                  </div>

                  {authType !== 'nopass' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold">Mot de passe</label>
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Clé de sécurité"
                        className="input input-sm input-bordered w-full font-mono"
                      />
                    </div>
                  )}
                </div>

                <label className="label cursor-pointer justify-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    checked={isHidden}
                    onChange={(e) => setIsHidden(e.target.checked)}
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  <span className="label-text text-xs font-medium">Réseau Wi-Fi masqué</span>
                </label>
              </div>
            ) : (
              <div className="bg-base-100 p-4 rounded-xl border border-base-300 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold">
                    {mode === 'url' ? 'URL cible' : 'Contenu textuel'}
                  </label>
                  {/* Compteur d'octets / taille */}
                  <span
                    className={`font-mono text-xs ${
                      isTooLong ? 'text-error font-bold' : 'text-base-content/60'
                    }`}
                  >
                    {byteLength} / {maxAllowedBytes} octets
                  </span>
                </div>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={mode === 'url' ? 2 : 5}
                  placeholder={mode === 'url' ? 'https://0w.lat' : 'Écrivez votre message...'}
                  className={`textarea textarea-bordered w-full font-mono text-xs ${
                    isTooLong ? 'border-error focus:border-error' : ''
                  }`}
                />
                {isTooLong && (
                  <p className="text-xs text-error flex items-center gap-1.5 mt-1">
                    <span className="icon-[lucide--alert-circle] size-4 shrink-0"></span>
                    Le contenu dépasse la capacité physique d'un QR code. Raccourcissez le texte ou réduisez la tolérance aux erreurs ci-dessous.
                  </p>
                )}
              </div>
            )}

            {/* Customization Settings */}
            <div className="bg-base-100 p-4 rounded-xl border border-base-300 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                Personnalisation visuelle
              </span>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Couleur des motifs</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="size-8 rounded cursor-pointer border border-base-300 bg-transparent"
                    />
                    <span className="font-mono text-xs uppercase">{fgColor}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Couleur d'arrière-plan</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="size-8 rounded cursor-pointer border border-base-300 bg-transparent"
                    />
                    <span className="font-mono text-xs uppercase">{bgColor}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium">Tolérance aux erreurs</label>
                    <span className="text-[10px] text-base-content/60 font-mono">
                      Max: {QR_MAX_BYTES[errorLevel]} o
                    </span>
                  </div>
                  <select
                    value={errorLevel}
                    onChange={(e) => setErrorLevel(e.target.value as ErrorLevel)}
                    className="select select-sm select-bordered w-full"
                  >
                    <option value="L">Faible (~7% récupération, max 2.9 Ko)</option>
                    <option value="M">Moyenne (~15% récupération, max 2.3 Ko)</option>
                    <option value="Q">Quartile (~25% récupération, max 1.6 Ko)</option>
                    <option value="H">Haute (~30% récupération, max 1.2 Ko)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Taille d'export ({size}px)</label>
                  <input
                    type="range"
                    min="128"
                    max="512"
                    step="32"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="range range-primary range-xs mt-2"
                  />
                </div>
              </div>

              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  checked={includeMargin}
                  onChange={(e) => setIncludeMargin(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary"
                />
                <span className="label-text text-xs">Ajouter une marge de sécurité blanche</span>
              </label>
            </div>

          </div>

          {/* Preview & Print Column */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4">

            <div
              id="printable-card"
              className="bg-white text-black p-6 rounded-2xl shadow-lg border border-base-300 flex flex-col items-center gap-4 w-full max-w-sm text-center"
            >
              {mode === 'wifi' && (
                <div className="flex flex-col items-center gap-1">
                  <span className="icon-[lucide--wifi] size-8 text-black"></span>
                  <h3 className="font-bold text-lg leading-tight tracking-tight">Accès Wi-Fi Invité</h3>
                  <p className="text-xs text-gray-500 font-mono">Scannez pour vous connecter</p>
                </div>
              )}

              {/* Rendu sécurisé : Alerte UI si trop long, Canvas sinon */}
              <div ref={qrRef} className="p-2 bg-white rounded-lg inline-flex items-center justify-center min-h-[200px] w-full">
                {isTooLong ? (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-error/50 rounded-xl bg-error/5 text-error text-center gap-2 w-full">
                    <span className="icon-[lucide--alert-triangle] size-8 shrink-0"></span>
                    <span className="text-xs font-bold">Données trop longues</span>
                    <span className="text-[11px] text-gray-600 leading-tight">
                      Le contenu ({byteLength} octets) dépasse la limite physique du QR code pour ce niveau d'erreur ({maxAllowedBytes} octets).
                    </span>
                  </div>
                ) : (
                  <QRCodeCanvas
                    value={qrValue || ' '}
                    size={size}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    level={errorLevel}
                    includeMargin={includeMargin}
                    className="max-w-full h-auto"
                  />
                )}
              </div>

              {mode === 'wifi' && (
                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Réseau :</span>
                    <span className="font-mono font-bold text-gray-900 truncate max-w-[150px]">{ssid || '—'}</span>
                  </div>
                  {authType !== 'nopass' && password && (
                    <div className="flex justify-between border-t border-gray-200 pt-1">
                      <span className="font-semibold text-gray-600">Mot de passe :</span>
                      <span className="font-mono font-bold text-gray-900 truncate max-w-[150px]">{password}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 justify-center w-full max-w-sm">
              <button
                onClick={downloadPng}
                disabled={isTooLong}
                className="btn btn-sm btn-primary flex-1 gap-1.5 disabled:opacity-50"
              >
                <span className="icon-[lucide--download] size-4"></span>
                Télécharger PNG
              </button>

              {mode === 'wifi' && (
                <button
                  onClick={handlePrint}
                  disabled={isTooLong}
                  className="btn btn-sm btn-outline flex-1 gap-1.5 disabled:opacity-50"
                >
                  <span className="icon-[lucide--printer] size-4"></span>
                  Imprimer la fiche
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
