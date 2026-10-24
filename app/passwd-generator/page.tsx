// app/passwd-generator/page.tsx
import PasswordGeneratorComponent from "@/app/components/PasswordGeneratorComponent";

export default function Home() {
  return (
    <div className="max-w-7xl w-full mx-auto p-6 md:p-8">
      <PasswordGeneratorComponent />
    </div>
  );
}
