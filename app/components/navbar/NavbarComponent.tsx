// app/components/NavbarComponent.tsx
import Link from "next/link";
import ThemeToggleComponent from "@/app/components/ThemeToggleComponent";

export default function NavbarComponent() {
  return (
    <div className="navbar bg-base-300">
      <div className="navbar-start">
        <Link href="/" className="text-xl font-black text-primary-content">
          {process.env.NEXT_PUBLIC_APP_TITLE}
        </Link>
      </div>
      <div className="navbar-center">
        <button className="btn btn-ghost btn-sm">Apps</button>
      </div>
      <div className="navbar-end gap-2">
        <ThemeToggleComponent />
        <button className="btn btn-sm btn-primary">
          Connexion
        </button>
      </div>
    </div>
  );
}
