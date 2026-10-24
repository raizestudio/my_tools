import Link from "next/link";

export default function NavbarComponent() {
  return (
    <div className="navbar bg-base-300">
      <div className="navbar-start">
        <Link href="/">{process.env.APP_TITLE}</Link>
      </div>
      <div className="navbar-center">
        <button>Apps</button>
      </div>
      <div className="navbar-end">
        <button className="btn btn-primary">
          Connexion
        </button>
      </div>
    </div>
  );
}
