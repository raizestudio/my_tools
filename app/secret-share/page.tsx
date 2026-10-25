import type { Metadata } from 'next';
import SecretCreateComponent from '@/app/components/SecretCreateComponent';

const appTitle = process.env.NEXT_PUBLIC_APP_TITLE || '0w.lat';

export const metadata: Metadata = {
  title: `Partage de Secret Chiffré | ${appTitle}`,
  description: 'Partagez des données confidentielles avec chiffrement de bout en bout et autodestruction.',
};

export default function SecretSharePage() {
  return (
    <main className="container mx-auto px-4 py-8 flex flex-col grow">
      <SecretCreateComponent />
    </main>
  );
}
