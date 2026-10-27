// i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing, isValidLocale, type Locale } from "./routing";
import { en } from "@/app/lib/i18n/locales/en";
import { fr } from "@/app/lib/i18n/locales/fr";

const dictionaries: Record<Locale, typeof en> = { en, fr };

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = requested && isValidLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: dictionaries[locale],
  };
});
