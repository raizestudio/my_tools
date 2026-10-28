// app/[locale]/[...rest]/page.tsx
import type { Metadata } from "next";
import NotFoundPage from "../not-found";

export const metadata: Metadata = {
  title: "404 - Terminal Endpoint Missing",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CatchAllPage() {
  return <NotFoundPage />;
}
