'use client';

import { useState, useEffect, useCallback } from 'react';

export default function PasswordGeneratorComponent() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    let uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      lowercaseChars = lowercaseChars.replace(/[ilo]/g, '');
      uppercaseChars = uppercaseChars.replace(/[IO]/g, '');
      numberChars = numberChars.replace(/[01]/g, '');
    }

    let allowedChars = '';
    let mandatorySets: string[] = [];

    if (includeLowercase) {
      allowedChars += lowercaseChars;
      mandatorySets.push(lowercaseChars);
    }
    if (includeUppercase) {
      allowedChars += uppercaseChars;
      mandatorySets.push(uppercaseChars);
    }
    if (includeNumbers) {
      allowedChars += numberChars;
      mandatorySets.push(numberChars);
    }
    if (includeSymbols) {
      allowedChars += symbolChars;
      mandatorySets.push(symbolChars);
    }

    if (allowedChars.length === 0) {
      setPassword('Sélectionnez au moins une option');
      return;
    }

    const generatedArray = new Array(length);
    const cryptoBuffer = new Uint32Array(length);
    window.crypto.getRandomValues(cryptoBuffer);

    let i = 0;
    for (const charSet of mandatorySets) {
      if (i < length) {
        const randomIndex = cryptoBuffer[i] % charSet.length;
        generatedArray[i] = charSet[randomIndex];
        i++;
      }
    }

    for (; i < length; i++) {
      const randomIndex = cryptoBuffer[i] % allowedChars.length;
      generatedArray[i] = allowedChars[randomIndex];
    }

    const shuffleBuffer = new Uint32Array(length);
    window.crypto.getRandomValues(shuffleBuffer);
    for (let j = length - 1; j > 0; j--) {
      const swapIndex = shuffleBuffer[j] % (j + 1);
      const temp = generatedArray[j];
      generatedArray[j] = generatedArray[swapIndex];
      generatedArray[swapIndex] = temp;
    }

    setPassword(generatedArray.join(''));
    setCopied(false);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const copyToClipboard = async () => {
    if (!password || password.startsWith('Sélectionnez')) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur de copie :', err);
    }
  };

  const getPasswordStrength = () => {
    if (password.startsWith('Sélectionnez')) return { label: 'Invalide', color: 'bg-error', width: 'w-0' };

    let score = 0;
    if (length >= 8) score++;
    if (length >= 12) score++;
    if (length >= 16) score++;

    const typesCount = [includeUppercase, includeLowercase, includeNumbers, includeSymbols].filter(Boolean).length;
    score += typesCount;

    if (score <= 3) return { label: 'Faible ⚠️', color: 'bg-error', width: 'w-1/4' };
    if (score <= 5) return { label: 'Moyen ⚖️', color: 'bg-warning', width: 'w-2/4' };
    if (score <= 6) return { label: 'Fort 💪', color: 'bg-info', width: 'w-3/4' };
    return { label: 'Excellent 🔥', color: 'bg-success', width: 'w-full' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="card bg-base-200 shadow-xl max-w-lg mx-auto">
      <div className="card-body gap-4">
        <h2 className="card-title text-xl font-bold flex items-center gap-2">
          <span className="icon-[lucide--lock] text-primary size-6"></span>
          Générateur de mot de passe fort
        </h2>

        {/* Affichage du mot de passe */}
        <div className="flex gap-2 items-center bg-base-300 p-3 rounded-lg border border-base-100 font-mono text-lg break-all select-all relative group">
          <span className="flex-1">{password}</span>
          <div className="flex gap-1">
            <button
              onClick={generatePassword}
              className="btn btn-square btn-ghost btn-sm"
              title="Régénérer"
            >
              <span className="icon-[lucide--rotate-cw] size-4"></span>
            </button>
            <button
              onClick={copyToClipboard}
              className={`btn btn-square btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
              title="Copier"
            >
              <span className={copied ? "icon-[lucide--check] size-4" : "icon-[lucide--copy] size-4"}></span>
            </button>
          </div>
        </div>

        {/* Jauge de force */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-semibold">
            <span>Force estimée :</span>
            <span>{strength.label}</span>
          </div>
          <div className="w-full bg-base-300 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all duration-500 ${strength.color} ${strength.width}`}></div>
          </div>
        </div>

        {/* Longueur du mot de passe */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex justify-between font-semibold text-sm">
            <span>Longueur :</span>
            <span className="text-primary font-mono">{length} caractères</span>
          </div>
          <input
            type="range"
            min="6"
            max="64"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="range range-primary"
          />
          <div className="flex justify-between text-xs px-2 opacity-50">
            <span>6</span>
            <span>16</span>
            <span>32</span>
            <span>48</span>
            <span>64</span>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <label className="label cursor-pointer justify-start gap-3 bg-base-300/30 p-2 rounded-lg hover:bg-base-300/50 transition">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(e) => setIncludeUppercase(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <span className="label-text font-medium">Majuscules (A-Z)</span>
          </label>

          <label className="label cursor-pointer justify-start gap-3 bg-base-300/30 p-2 rounded-lg hover:bg-base-300/50 transition">
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={(e) => setIncludeLowercase(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <span className="label-text font-medium">Minuscules (a-z)</span>
          </label>

          <label className="label cursor-pointer justify-start gap-3 bg-base-300/30 p-2 rounded-lg hover:bg-base-300/50 transition">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(e) => setIncludeNumbers(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <span className="label-text font-medium">Chiffres (0-9)</span>
          </label>

          <label className="label cursor-pointer justify-start gap-3 bg-base-300/30 p-2 rounded-lg hover:bg-base-300/50 transition">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <span className="label-text font-medium">Symboles (!@#...)</span>
          </label>
        </div>

        {/* Option d'exclusion des caractères similaires */}
        <div className="mt-2 border-t border-base-100 pt-3">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              checked={excludeSimilar}
              onChange={(e) => setExcludeSimilar(e.target.checked)}
              className="checkbox checkbox-sm checkbox-secondary"
            />
            <div className="flex flex-col">
              <span className="label-text font-semibold">Éviter les caractères similaires</span>
              <span className="label-text-alt text-base-content/60">Exclut les caractères ambigus comme i, l, 1, L, o, 0, O</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
