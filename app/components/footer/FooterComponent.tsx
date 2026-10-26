// app/components/footer/FooterComponent.tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const currentYear = new Date().getFullYear();

export default function FooterComponent() {
  const t = useTranslations("common");

  return (
    <footer className="footer bg-base-200 -bottom-px sticky inset-s-0 w-full px-6 py-4">
      <aside className="grid-flow-col items-center">
        <p>
          &copy;{currentYear}{" "}
          <Link className="link link-hover font-medium" href="/">
            {process.env.NEXT_PUBLIC_APP_TITLE}
          </Link>
        </p>
      </aside>
      <nav className="text-base-content grid-flow-col gap-4 md:place-self-center md:justify-self-end">
        {/*<a className="link link-hover" href="#">
          License
        </a>*/}
        <a
          className="link link-hover"
          href="https://github.com/raizestudio/my_tools"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("help")}
        </a>
        <a
          className="link link-hover"
          href="https://github.com/raizestudio/my_tools"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("contribute")}
        </a>
        <a
          className="link link-hover"
          href="https://buymeacoffee.com/joelpinho1h"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("buyMeACoffee")}
        </a>
        {/*<a className="link link-hover" href="#">Contact</a>*/}
        {/*<a className="link link-hover" href="#">Policy</a>*/}
      </nav>
    </footer>
  );
}
