// app/components/LanguageSwitcherComponent.tsx
'use client';

import { useI18n } from '@/app/context/I18nContext';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="join">
      <button
        type="button"
        onClick={() => setLocale('fr')}
        className={`join-item btn btn-xs ${locale === 'fr' ? 'btn-primary' : 'btn-ghost'}`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`join-item btn btn-xs ${locale === 'en' ? 'btn-primary' : 'btn-ghost'}`}
      >
        EN
      </button>
    </div>
  );
}
