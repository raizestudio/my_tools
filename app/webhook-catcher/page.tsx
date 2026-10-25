// app/tools/webhook-catcher/page.tsx
import type { Metadata } from 'next';
import WebhookCatcherComponent from '@/app/components/WebhookCatcherComponent';

const appTitle = process.env.NEXT_PUBLIC_APP_TITLE || '0w.lat';

export const metadata: Metadata = {
  title: `Webhook & Request Catcher | ${appTitle}`,
  description: 'Inspectez des requêtes HTTP et testez des webhooks en direct avec rafraîchissement WebSocket.',
};

export default function WebhookCatcherPage() {
  return (
    <main className="container mx-auto px-4 py-8 flex flex-col grow">
      <WebhookCatcherComponent />
    </main>
  );
}
