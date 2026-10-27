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
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="join">
      <button
        type="button"
        disabled={isPending}
        onClick={() => switchLocale('fr')}
        className={`join-item btn btn-xs text-base-content shadow-none ${
          locale === 'fr' ? 'btn-primary text-primary-content' : 'bg-base-100 border-base-100'
        }`}
      >
        FR
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => switchLocale('en')}
        className={`join-item btn btn-xs text-base-content shadow-none ${
          locale === 'en' ? 'btn-primary text-primary-content' : 'bg-base-100 border-base-100'
        }`}
      >
        EN
      </button>
    </div>
  );
}
