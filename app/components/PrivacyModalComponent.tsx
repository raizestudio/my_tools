// app/components/PrivacyModalComponent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface PrivacyPoint {
  icon: string;
  title: string;
  desc: string;
}

export default function PrivacyModalComponent() {
  const tPrivacy = useTranslations('privacyNotice');
  const tCommon = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasAcknowledged = localStorage.getItem('0w_privacy_ack');
    if (!hasAcknowledged) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('0w_privacy_ack', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const points = (tPrivacy.raw('points') ?? []) as PrivacyPoint[];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="card card-border bg-base-100 max-w-lg w-full shadow-2xl p-6 sm:p-7 flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="badge badge-sm badge-soft badge-primary">
              {tPrivacy('badge')}
            </span>
          </div>
          <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
            <span className="icon-[lucide--shield-check] size-5 text-primary"></span>
            {tPrivacy('title')}
          </h2>
          <p className="text-xs text-base-content/70 leading-relaxed">
            {tPrivacy('subtitle')}
          </p>
        </div>

        {/* Feature List */}
        <div className="flex flex-col gap-3 bg-base-200/40 p-4 rounded-xl border border-base-content/5">
          {Array.isArray(points) &&
            points.map((point, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="size-7 rounded-lg bg-base-100 border border-base-content/10 flex items-center justify-center shrink-0 mt-0.5 text-primary">
                  <span className={`${point.icon} size-3.5`}></span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-base-content">
                    {point.title}
                  </span>
                  <span className="text-[11px] text-base-content/65 leading-normal">
                    {point.desc}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Open Source & Support Section */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="icon-[lucide--heart-handshake] size-4 text-primary"></span>
            <span className="text-xs font-semibold text-base-content">
              {tPrivacy('supportTitle')}
            </span>
          </div>
          <p className="text-[11px] text-base-content/70 leading-relaxed">
            {tPrivacy('supportDesc')}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href="https://github.com/raizestudio/my_tools"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-xs btn-outline gap-1.5"
            >
              <span className="icon-[lucide--github] size-3.5"></span>
              <span>{tCommon('contribute')}</span>
            </a>
            <a
              href="https://buymeacoffee.com/joelpinho1h"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-xs btn-outline gap-1.5"
            >
              <span className="icon-[lucide--coffee] size-3.5 text-warning"></span>
              <span>{tCommon('buyMeACoffee')}</span>
            </a>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="btn btn-primary btn-sm w-full font-medium"
          >
            {tPrivacy('button')}
          </button>
        </div>
      </div>
    </div>
  );
}
