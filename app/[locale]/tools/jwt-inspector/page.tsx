// app/[locale]/tools/jwt-inspector/page.tsx
import type { Metadata } from 'next';
import JwtInspectorComponent from '@/app/components/JwtInspectorComponent';

export const metadata: Metadata = {
  title: 'JWT Inspector & Signature Debugger',
  description:
    'Decode JSON Web Tokens, inspect RFC 7519 claims, and verify HMAC signatures locally in your browser with zero network exposure.',
  openGraph: {
    title: 'JWT Inspector | 0w Toolbox',
    description: 'Zero-knowledge client-side JWT decoder and signature verifier.',
  },
};

export default function JwtInspectorPage() {
  return (
    <div className="max-w-6xl w-full mx-auto p-4 md:p-8">
      <JwtInspectorComponent />
    </div>
  );
}
