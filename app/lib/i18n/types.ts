// app/lib/i18n/types.ts
import type { en } from './locales/en';

export type Locale = 'en' | 'fr';

// Base dictionary schema inferred directly from the English source of truth
export type Dictionary = typeof en;
