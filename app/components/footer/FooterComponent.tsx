import Link from "next/link";

const currentYear = new Date().getFullYear()

export default function FooterComponent() {
  return (
    <footer className="footer bg-base-200 absolute -bottom-px sticky start-0 w-full px-6 py-4">
          <aside className="grid-flow-col items-center">
        <p>&copy;{ currentYear } <Link className="link link-hover font-medium" href="/">{ process.env.NEXT_PUBLIC_APP_TITLE }</Link></p>
          </aside>
          <nav className="text-base-content grid-flow-col gap-4 md:place-self-center md:justify-self-end">
            <a className="link link-hover" href="#">License</a>
            <a className="link link-hover" href="#">Help</a>
            <a className="link link-hover" href="#">Contact</a>
            <a className="link link-hover" href="#">Policy</a>
          </nav>
        </footer>
  )
}
