// app/[locale]/tools/json-converter/page.tsx

import type { Metadata } from 'next';
import JsonConverterComponent from '@/app/components/JsonConverterComponent';

export const metadata: Metadata = {
  title: `Convertisseur JSON ↔ TypeScript / Pydantic - ${process.env.NEXT_PUBLIC_APP_TITLE}`,
  description: 'Générez des interfaces TypeScript et modèles Pydantic v2 à partir de données JSON brutes.',
};

export default function JsonConverterPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <JsonConverterComponent />
    </main>
  );
}
