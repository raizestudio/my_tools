// middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match toutes les routes sauf fichiers statiques, api, et _next
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
