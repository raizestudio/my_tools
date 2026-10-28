// app/components/landing/TechnicalPillarsComponent.tsx
import { getTranslations } from "next-intl/server";

interface TechnicalPillarsProps {
  locale: string;
}

export default async function TechnicalPillarsComponent({
  locale,
}: TechnicalPillarsProps) {
  const t = await getTranslations({ locale, namespace: "landing" });

  const pillars = [
    {
      index: "01",
      protocol: "CLIENT ENGINE",
      icon: "icon-[lucide--cpu]",
      badge: "WebCrypto • WASM",
      badgeClass: "badge-soft badge-primary text-primary",
      colorClass: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content",
      hoverBorder: "hover:border-primary/40",
      title: t("pillarClientTitle"),
      desc: t("pillarClientDesc"),
    },
    {
      index: "02",
      protocol: "MEMORY RELAY",
      icon: "icon-[lucide--server]",
      badge: "RAM Ephemeral",
      badgeClass: "badge-soft badge-secondary text-secondary",
      colorClass: "bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-content",
      hoverBorder: "hover:border-secondary/40",
      title: t("pillarRelayTitle"),
      desc: t("pillarRelayDesc"),
    },
    {
      index: "03",
      protocol: "NETWORK GUARD",
      icon: "icon-[lucide--shield-alert]",
      badge: "SSRF Hardened",
      badgeClass: "badge-soft badge-accent text-accent",
      colorClass: "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-content",
      hoverBorder: "hover:border-accent/40",
      title: t("pillarSsrfTitle"),
      desc: t("pillarSsrfDesc"),
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-0 md:my-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((pillar) => (
          <div
            key={pillar.index}
            className={`group relative card card-border bg-base-200/30 border-base-content/10 ${pillar.hoverBorder} p-6 sm:p-7 rounded-2xl shadow-xs transition-all duration-300 flex flex-col justify-between overflow-hidden hover:bg-base-200/60`}
          >
            {/* Subtle Top-Right Ambient Corner Glow on Hover */}
            <div className="absolute -top-12 -right-12 size-28 bg-base-content/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />

            {/* Card Header: Icon + Protocol Index */}
            <div className="flex items-center justify-between pb-4 border-b border-base-content/5">
              <div
                className={`size-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-2xs ${pillar.colorClass}`}
              >
                <span className={`${pillar.icon} size-5.5`}></span>
              </div>
              <span className="font-mono text-[11px] font-bold text-base-content/40 tracking-wider">
                {pillar.index} // {pillar.protocol}
              </span>
            </div>

            {/* Card Content */}
            <div className="flex flex-col gap-2 pt-5 grow">
              <h3 className="font-bold text-base text-base-content tracking-tight group-hover:text-primary transition-colors">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                {pillar.desc}
              </p>
            </div>

            {/* Card Footer: Architecture Specs */}
            <div className="pt-5 mt-6 border-t border-base-content/5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-base-content/40 uppercase tracking-wider">
                Protocol
              </span>
              <span className={`badge badge-xs font-mono font-semibold py-2 px-2.5 ${pillar.badgeClass}`}>
                {pillar.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
