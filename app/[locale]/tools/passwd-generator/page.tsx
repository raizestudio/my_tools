// app/[locale]/tools/passwd-generator/page.tsx
import type { Metadata } from 'next';
import PasswordGeneratorComponent from "@/app/components/PasswordGeneratorComponent";

export const metadata: Metadata = {
  title: `Génerateur de mots de passe - ${process.env.NEXT_PUBLIC_APP_TITLE}`,
  description: 'Générez des mots de passe forts',
};

export default function Home() {
  return (
    <div className="max-w-7xl w-full mx-auto p-6 md:p-8">
      <PasswordGeneratorComponent />
    </div>
  );
}
