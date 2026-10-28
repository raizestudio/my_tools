// app/[locale]/tools/qr-code/page.tsx
import type { Metadata } from 'next';
import QrCodeGeneratorComponent from '@/app/components/QrCodeGeneratorComponent';

const appTitle = process.env.NEXT_PUBLIC_APP_TITLE || '0w.lat';

export const metadata: Metadata = {
  title: `Générateur de QR Code & Wi-Fi | ${appTitle}`,
  description: 'Créez des QR codes personnalisés pour liens web, textes et fiches de connexion Wi-Fi prêtes à imprimer.',
};

export default function QrCodePage() {
  return (
    <main className="container mx-auto px-4 py-8 flex flex-col grow">
      <QrCodeGeneratorComponent />
    </main>
  );
}
