// app/lib/i18n/dictionaries.ts
import { en } from './locales/en';
import { fr } from './locales/fr';
import type { Dictionary, Locale } from './types';

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  fr,
};

export type { Dictionary, Locale };
