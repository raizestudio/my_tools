// app/components/password/PasswordGeneratorComponent.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DICEWARE_WORDS } from "@/app/lib/dicewareWordlist";

import ToolHeader from "@/app/components/ui/ToolHeaderComponent";

type Mode = "password" | "passphrase" | "secret";
type SecretFormat = "hex" | "base64" | "base64url" | "uuid";

export default function PasswordGeneratorComponent() {
  const t = useTranslations("tools.passwordGenerator");
  const tCommon = useTranslations("common");

  const [mode, setMode] = useState<Mode>("password");
  const [result, setResult] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Standard Password Config
  const [pwdLength, setPwdLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);

  // Passphrase Config
  const [wordCount, setWordCount] = useState(5);
  const [separator, setSeparator] = useState("-");
  const [capitalize, setCapitalize] = useState(false);
  const [includeNumber, setIncludeNumber] = useState(false);

  // Secret Config
  const [secretBytes, setSecretBytes] = useState(32); // 32 bytes = 256 bits
  const [secretFormat, setSecretFormat] = useState<SecretFormat>("hex");

  // Sélecteur sécurisé de nombres aléatoires
  const getRandomInt = (max: number): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };

  // 1. Génération Mode Mot de passe
  const generatePassword = useCallback(() => {
    let upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lower = "abcdefghijklmnopqrstuvwxyz";
    let numbers = "0123456789";
    let symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (avoidAmbiguous) {
      upper = upper.replace(/[O]/g, "");
      lower = lower.replace(/[ol]/g, "");
      numbers = numbers.replace(/[01]/g, "");
      symbols = symbols.replace(/[|;:.<>]/g, "");
    }

    let charset = "";
    if (useUpper) charset += upper;
    if (useLower) charset += lower;
    if (useNumbers) charset += numbers;
    if (useSymbols) charset += symbols;

    if (!charset) {
      setResult("");
      return;
    }

    const randomIndices = new Uint32Array(pwdLength);
    crypto.getRandomValues(randomIndices);

    let out = "";
    for (let i = 0; i < pwdLength; i++) {
      out += charset[randomIndices[i] % charset.length];
    }
    setResult(out);
  }, [pwdLength, useUpper, useLower, useNumbers, useSymbols, avoidAmbiguous]);

  // 2. Génération Mode Passphrase Diceware
  const generatePassphrase = useCallback(() => {
    const listLen = DICEWARE_WORDS.length;
    const randomWords: string[] = [];

    for (let i = 0; i < wordCount; i++) {
      let word = DICEWARE_WORDS[getRandomInt(listLen)];
      if (capitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      randomWords.push(word);
    }

    if (includeNumber) {
      const targetIndex = getRandomInt(randomWords.length);
      const digit = getRandomInt(100).toString();
      randomWords[targetIndex] = `${randomWords[targetIndex]}${digit}`;
    }

    setResult(randomWords.join(separator));
  }, [wordCount, separator, capitalize, includeNumber]);

  // 3. Génération Mode Secret Développeur
  const generateSecret = useCallback(() => {
    if (secretFormat === "uuid") {
      setResult(crypto.randomUUID());
      return;
    }

    const bytes = new Uint8Array(secretBytes);
    crypto.getRandomValues(bytes);

    if (secretFormat === "hex") {
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setResult(hex);
    } else if (secretFormat === "base64") {
      let binary = "";
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      setResult(btoa(binary));
    } else if (secretFormat === "base64url") {
      let binary = "";
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      const b64 = btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      setResult(b64);
    }
  }, [secretBytes, secretFormat]);

  // Trigger actif selon le mode
  const handleRegenerate = useCallback(() => {
    if (mode === "password") generatePassword();
    else if (mode === "passphrase") generatePassphrase();
    else if (mode === "secret") generateSecret();
  }, [mode, generatePassword, generatePassphrase, generateSecret]);

  useEffect(() => {
    handleRegenerate();
  }, [handleRegenerate]);

  // Calcul mathématique exact de l'entropie
  const entropy = useMemo(() => {
    if (!result) return 0;

    if (mode === "secret") {
      if (secretFormat === "uuid") return 122; // 122 bits d'aléa dans UUIDv4
      return secretBytes * 8;
    }

    if (mode === "passphrase") {
      let bits = wordCount * Math.log2(DICEWARE_WORDS.length);
      if (includeNumber) bits += Math.log2(100);
      if (capitalize) bits += wordCount; // 1 bit par mot maj/min
      return Math.round(bits);
    }

    // Mode Password : L * log2(pool)
    let pool = 0;
    if (useUpper) pool += 26;
    if (useLower) pool += 26;
    if (useNumbers) pool += 10;
    if (useSymbols) pool += 28;
    if (avoidAmbiguous) pool = Math.max(pool - 6, 2);

    if (pool <= 0) return 0;
    return Math.round(pwdLength * Math.log2(pool));
  }, [
    result,
    mode,
    secretBytes,
    secretFormat,
    wordCount,
    includeNumber,
    capitalize,
    useUpper,
    useLower,
    useNumbers,
    useSymbols,
    avoidAmbiguous,
    pwdLength,
  ]);

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  // Temps estimé pour craquer (base 100 milliards d'essais/s sur cluster GPU)
  const crackEstimate = useMemo(() => {
    if (entropy <= 32) return "< 1 sec";
    if (entropy <= 45) return "minutes";
    if (entropy <= 55) return "several days";
    if (entropy <= 65) return "several years";
    if (entropy <= 75) return "centuries";
    return "unbreakable (trillions of years)";
  }, [entropy]);

  const strengthColor =
    entropy < 45
      ? "text-error progress-error"
      : entropy < 65
        ? "text-warning progress-warning"
        : entropy < 85
          ? "text-success progress-success"
          : "text-primary progress-primary";

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      {/* Header & Fil d'Ariane */}
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--link]"
        // badge={
        //   <span className="badge badge-sm badge-soft badge-primary">
        //     100% Local
        //   </span>
        // }
      />

      {/* Mode Switcher Tabs */}
      <div className="join w-full grid grid-cols-3 bg-base-200/50 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`btn btn-sm join-item ${mode === "password" ? "btn-primary shadow-sm" : "btn-ghost"}`}
        >
          <span className="icon-[lucide--lock] size-4"></span>
          <span className="hidden sm:inline">{t("tabPassword")}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("passphrase")}
          className={`btn btn-sm join-item ${mode === "passphrase" ? "btn-primary shadow-sm" : "btn-ghost"}`}
        >
          <span className="icon-[lucide--book-marked] size-4"></span>
          <span className="hidden sm:inline">{t("tabPassphrase")}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("secret")}
          className={`btn btn-sm join-item ${mode === "secret" ? "btn-primary shadow-sm" : "btn-ghost"}`}
        >
          <span className="icon-[lucide--terminal] size-4"></span>
          <span className="hidden sm:inline">{t("tabSecret")}</span>
        </button>
      </div>

      {/* Main Output Box */}
      <div className="card card-border bg-base-100 p-6 flex flex-col gap-4 shadow-sm">
        <div className="relative">
          <textarea
            readOnly
            rows={mode === "passphrase" || mode === "secret" ? 3 : 2}
            value={result}
            className="textarea textarea-bordered w-full font-mono text-sm sm:text-base pr-28 resize-none bg-base-200/30 focus:outline-primary select-all leading-relaxed"
          />
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRegenerate}
              className="btn btn-sm btn-ghost btn-square text-base-content/70 hover:text-primary"
              title={t("regenerate")}
            >
              <span className="icon-[lucide--refresh-cw] size-4"></span>
            </button>
            <button
              type="button"
              onClick={copyToClipboard}
              className={`btn btn-sm ${isCopied ? "btn-success" : "btn-primary"} gap-1.5`}
            >
              <span
                className={`icon-[lucide--${isCopied ? "check" : "copy"}] size-4`}
              ></span>
              <span>{isCopied ? t("copied") : t("copy")}</span>
            </button>
          </div>
        </div>

        {/* Entropy Metrics */}
        <div className="flex flex-col gap-2 pt-2 border-t border-base-content/10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-base-content flex items-center gap-1.5">
              <span className="icon-[lucide--shield-check] size-4 text-primary"></span>
              {t("entropyBits", { bits: entropy })}
            </span>
            <span
              className={`font-mono text-[11px] font-bold ${strengthColor.split(" ")[0]}`}
            >
              {entropy < 45
                ? t("strengthWeak")
                : entropy < 65
                  ? t("strengthFair")
                  : entropy < 85
                    ? t("strengthStrong")
                    : t("strengthCryptographic")}
            </span>
          </div>

          <progress
            className={`progress w-full h-1.5 ${strengthColor.split(" ")[1]}`}
            value={Math.min(entropy, 128)}
            max={128}
          ></progress>

          <span className="text-[11px] text-base-content/50">
            {t("estimatedCrackTime", { time: crackEstimate })}
          </span>
        </div>
      </div>

      {/* Controls Container */}
      <div className="card card-border bg-base-100 p-6 flex flex-col gap-6">
        {/* MODE 1: Standard Password */}
        {mode === "password" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span>{t("length", { length: pwdLength })}</span>
                <span className="font-mono text-primary font-bold">
                  {pwdLength}
                </span>
              </div>
              <input
                type="range"
                min={6}
                max={64}
                value={pwdLength}
                onChange={(e) => setPwdLength(Number(e.target.value))}
                className="range range-xs range-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="label cursor-pointer justify-start gap-3 bg-base-200/40 p-3 rounded-lg border border-base-content/5">
                <input
                  type="checkbox"
                  checked={useUpper}
                  onChange={(e) => setUseUpper(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary"
                />
                <span className="label-text text-xs">{t("uppercase")}</span>
              </label>

              <label className="label cursor-pointer justify-start gap-3 bg-base-200/40 p-3 rounded-lg border border-base-content/5">
                <input
                  type="checkbox"
                  checked={useLower}
                  onChange={(e) => setUseLower(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary"
                />
                <span className="label-text text-xs">{t("lowercase")}</span>
              </label>

              <label className="label cursor-pointer justify-start gap-3 bg-base-200/40 p-3 rounded-lg border border-base-content/5">
                <input
                  type="checkbox"
                  checked={useNumbers}
                  onChange={(e) => setUseNumbers(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary"
                />
                <span className="label-text text-xs">{t("numbers")}</span>
              </label>

              <label className="label cursor-pointer justify-start gap-3 bg-base-200/40 p-3 rounded-lg border border-base-content/5">
                <input
                  type="checkbox"
                  checked={useSymbols}
                  onChange={(e) => setUseSymbols(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary"
                />
                <span className="label-text text-xs">{t("symbols")}</span>
              </label>

              <label className="label cursor-pointer justify-start gap-3 bg-base-200/40 p-3 rounded-lg border border-base-content/5 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={avoidAmbiguous}
                  onChange={(e) => setAvoidAmbiguous(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary"
                />
                <span className="label-text text-xs">
                  {t("avoidAmbiguous")}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* MODE 2: Passphrase Diceware */}
        {mode === "passphrase" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span>{t("wordsCount", { count: wordCount })}</span>
                <span className="font-mono text-primary font-bold">
                  {wordCount} mots
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={10}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="range range-xs range-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-base-content/70">
                  {t("separator")}
                </label>
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="select select-sm select-bordered w-full"
                >
                  <option value="-">{t("separatorHyphen")}</option>
                  <option value=".">{t("separatorDot")}</option>
                  <option value="_">{t("separatorUnderscore")}</option>
                  <option value=" ">{t("separatorSpace")}</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 justify-end">
                <label className="label cursor-pointer justify-start gap-3 bg-base-200/40 p-2.5 rounded-lg border border-base-content/5">
                  <input
                    type="checkbox"
                    checked={capitalize}
                    onChange={(e) => setCapitalize(e.target.checked)}
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  <span className="label-text text-xs">{t("capitalize")}</span>
                </label>

                <label className="label cursor-pointer justify-start gap-3 bg-base-200/40 p-2.5 rounded-lg border border-base-content/5">
                  <input
                    type="checkbox"
                    checked={includeNumber}
                    onChange={(e) => setIncludeNumber(e.target.checked)}
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  <span className="label-text text-xs">
                    {t("includeNumber")}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: Dev Secret */}
        {mode === "secret" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-base-content/70">
                {t("secretType")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["hex", "base64", "base64url", "uuid"] as SecretFormat[]).map(
                  (fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setSecretFormat(fmt)}
                      className={`btn btn-sm ${secretFormat === fmt ? "btn-primary" : "btn-outline"}`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ),
                )}
              </div>
            </div>

            {secretFormat !== "uuid" && (
              <div className="flex flex-col gap-2 pt-2">
                <label className="text-xs font-semibold text-base-content/70">
                  {t("bytesCount", {
                    bytes: secretBytes,
                    bits: secretBytes * 8,
                  })}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[16, 32, 64].map((bytes) => (
                    <button
                      key={bytes}
                      type="button"
                      onClick={() => setSecretBytes(bytes)}
                      className={`btn btn-sm ${secretBytes === bytes ? "btn-primary" : "btn-outline"}`}
                    >
                      {bytes}B ({bytes * 8}-bit)
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
