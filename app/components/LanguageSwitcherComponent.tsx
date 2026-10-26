// app/components/LanguageSwitcherComponent.tsx
'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (nextLocale: 'fr' | 'en') => {
    if (nextLocale === locale) return;

    startTransition(() => {
      // Conserve la route actuelle (ex: /fr/jwt-inspector -> /en/jwt-inspector)
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="join">
      <button
        type="button"
        disabled={isPending}
        onClick={() => switchLocale('fr')}
        className={`join-item btn btn-xs ${
          locale === 'fr' ? 'btn-primary' : 'btn-ghost'
        }`}
      >
        FR
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => switchLocale('en')}
        className={`join-item btn btn-xs ${
          locale === 'en' ? 'btn-primary' : 'btn-ghost'
        }`}
      >
        EN
      </button>
    </div>
  );
}
