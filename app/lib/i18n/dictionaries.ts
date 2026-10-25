// app/lib/i18n/dictionaries.ts
export type Locale = 'en' | 'fr';

export const dictionaries = {
  en: {
    common: {
      offlineTitle: 'Backend server offline',
      offlineDesc: 'API-dependent tools are temporarily unavailable.',
      copy: 'Copy',
      copied: 'Copied!',
      login: 'Login',
    },
    tools: {
      jsonConverter: {
        title: 'JSON Converter & Formatter',
        desc: 'Generate TypeScript interfaces and Pydantic v2 models directly from raw JSON.',
      },
      secretShare: {
        title: 'End-to-End Encrypted Secret Sharing',
        desc: 'Share sensitive credentials with client-side AES-GCM and zero-knowledge self-destruction.',
      },
    },
  },
  fr: {
    common: {
      offlineTitle: 'Serveur backend hors ligne',
      offlineDesc: 'Les outils nécessitant l’API sont momentanément désactivés.',
      copy: 'Copier',
      copied: 'Copié !',
      login: 'Connexion'
    },
    tools: {
      jsonConverter: {
        title: 'Convertisseur & Formateur JSON',
        desc: 'Générez instantanément des interfaces TypeScript ou modèles Pydantic v2.',
      },
      secretShare: {
        title: 'Partage de Secret Chiffré',
        desc: 'Chiffrement AES-GCM 256 bits côté client avec autodestruction à la lecture.',
      },
    },
  },
};
