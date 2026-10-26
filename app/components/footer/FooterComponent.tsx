"use client";

import Link from "next/link";
import { useI18n } from "@/app/context/I18nContext";

const currentYear = new Date().getFullYear();

export default function FooterComponent() {
    const { t } = useI18n();
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
                >
                    {t.common.help}
                </a>
                <a
                    className="link link-hover"
                    href="https://github.com/raizestudio/my_tools"
                    target="_blank"
                >
                    {t.common.contribute}
                </a>
                <a
                    className="link link-hover"
                    href="https://buymeacoffee.com/joelpinho1h"
                    target="_blank"
                >
                    {t.common.buyMeACoffee}
                </a>
                {/*<a className="link link-hover" href="#">Contact</a>*/}
                {/*<a className="link link-hover" href="#">Policy</a>*/}
            </nav>
        </footer>
    );
}
