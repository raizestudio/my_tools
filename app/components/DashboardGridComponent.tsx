// app/components/DashboardGridComponent.tsx
'use client';

import { useEffect, useState } from 'react';
import AppCardComponent, { AppItem } from '@/app/components/AppCardComponent';

interface DashboardGridProps {
  apps: AppItem[];
}

export default function DashboardGrid({ apps }: DashboardGridProps) {
  const [isLive, setIsLive] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const apiUrl = process.env.API_URL || 'http://localhost:8000';
      try {
        const res = await fetch(`${apiUrl}/health`, {
          signal: AbortSignal.timeout(2500),
        });
        setIsLive(res.ok);
      } catch {
        setIsLive(false);
      }
    };

    checkHealth();
  }, []);

  const isOffline = isLive === false;

  return (
    <div className="flex flex-col gap-6">
      {/* Offline Alert */}
      {isOffline && (
        <div className="alert alert-soft alert-warning flex items-start gap-3 animate-in fade-in duration-200">
          <span className="icon-[lucide--alert-triangle] size-5 text-warning shrink-0 mt-0.5"></span>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              Serveur backend hors ligne
            </span>
            <span className="text-xs text-base-content/70">
              L'instance est suspendue ou inaccessible. Les outils nécessitant l'API sont momentanément désactivés.
            </span>
          </div>
        </div>
      )}

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {apps.map((app) => (
          <AppCardComponent
            key={app.id}
            app={app}
            disabled={isOffline}
          />
        ))}
      </div>
    </div>
  );
}
