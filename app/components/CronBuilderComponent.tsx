// app/components/cron/CronBuilderComponent.tsx
"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import { useTranslations, useLocale } from "next-intl";
import cronstrue from "cronstrue";
import "cronstrue/locales/fr";
import { CronExpressionParser } from "cron-parser";
import ToolHeader from "@/app/components/ui/ToolHeaderComponent";
import CopyButton from "@/app/components/ui/CopyButtonComponent";

interface PresetItem {
  key: string;
  expression: string;
}

export default function CronBuilderComponent() {
  const t = useTranslations("tools.cronBuilder");
  const locale = useLocale();
  const isFr = locale === "fr";

  const [cronExpression, setCronExpression] = useState<string>("*/15 2-4 * * 1-5");
  const [activeSnippetTab, setActiveSnippetTab] = useState<"crontab" | "gha" | "k8s">("crontab");

  const subscribeClock = (callback: () => void) => {
    const timer = setInterval(callback, 1000);
    return () => clearInterval(timer);
  };

  const getClientSnapshot = () => Math.floor(Date.now() / 1000);
  const getServerSnapshot = () => null;

  const nowTimestamp = useSyncExternalStore(
    subscribeClock,
    getClientSnapshot,
    getServerSnapshot
  );

  const now = useMemo(() => {
    return nowTimestamp !== null ? new Date(nowTimestamp * 1000) : null;
  }, [nowTimestamp]);

  const presets: PresetItem[] = [
    { key: "presetEveryMinute", expression: "* * * * *" },
    { key: "presetEvery5Min", expression: "*/5 * * * *" },
    { key: "presetEvery15Min", expression: "*/15 * * * *" },
    { key: "presetHourly", expression: "0 * * * *" },
    { key: "presetDailyMidnight", expression: "0 0 * * *" },
    { key: "presetWeekdays9Am", expression: "0 9 * * 1-5" },
    { key: "presetWeeklySunday", expression: "0 0 * * 0" },
    { key: "presetMonthlyFirst", expression: "0 0 1 * *" },
  ];

  const segments = useMemo(() => {
    const parts = cronExpression.trim().split(/\s+/);
    return {
      minute: parts[0] || "*",
      hour: parts[1] || "*",
      dayOfMonth: parts[2] || "*",
      month: parts[3] || "*",
      dayOfWeek: parts[4] || "*",
      isValidLength: parts.length === 5,
    };
  }, [cronExpression]);

  const humanReadable = useMemo(() => {
    if (!segments.isValidLength) return null;
    try {
      return cronstrue.toString(cronExpression.trim(), {
        locale: isFr ? "fr" : "en",
        use24HourTimeFormat: true,
      });
    } catch {
      return null;
    }
  }, [cronExpression, segments.isValidLength, isFr]);

  const upcomingDates = useMemo(() => {
    if (!segments.isValidLength || !humanReadable || !now) return [];
    try {
      const interval = CronExpressionParser.parse(cronExpression.trim(), {
        currentDate: now,
      });

      const dates: Date[] = [];
      for (let i = 0; i < 8; i++) {
        dates.push(interval.next().toDate());
      }
      return dates;
    } catch {
      return [];
    }
  }, [cronExpression, segments.isValidLength, humanReadable, now]);

  const formatCountdown = (target: Date) => {
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return isFr ? "À l'instant" : "Just now";

    const diffSec = Math.floor(diffMs / 1000);
    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const snippetCode = useMemo(() => {
    const expr = cronExpression.trim();
    switch (activeSnippetTab) {
      case "crontab":
        return `${expr} /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1`;
      case "gha":
        return `name: Scheduled Workflow\non:\n  schedule:\n    - cron: '${expr}'\n\njobs:\n  run-task:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4`;
      case "k8s":
        return `apiVersion: batch/v1\nkind: CronJob\nmetadata:\n  name: scheduled-job\nspec:\n  schedule: "${expr}"\n  successfulJobsHistoryLimit: 3\n  jobTemplate:\n    spec:\n      template:\n        spec:\n          containers:\n          - name: worker\n            image: alpine:latest\n            args: ["echo", "running job"]\n          restartPolicy: OnFailure`;
    }
  }, [cronExpression, activeSnippetTab]);

  const updateSegment = (index: number, val: string) => {
    const parts = cronExpression.trim().split(/\s+/);
    while (parts.length < 5) parts.push("*");
    parts[index] = val || "*";
    setCronExpression(parts.join(" "));
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      <ToolHeader
        title={t("title")}
        description={t("desc")}
        icon="icon-[lucide--clock]"
        badge={
          <span className="badge badge-sm badge-soft badge-primary">
            {t("badgeStandard")}
          </span>
        }
      />

      {/* Main Builder & Live Human Translation Box */}
      <div className="card card-border bg-base-100 p-5 sm:p-6 shadow-sm flex flex-col gap-5">
        {/* Raw Cron Input & Quick Copy */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center justify-between">
            <span>{t("inputLabel")}</span>
            <span className="font-mono text-xs text-primary">5 fields: m h dom mon dow</span>
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="* * * * *"
              className={`input input-bordered font-mono text-base sm:text-lg font-bold flex-1 tracking-wider ${
                !humanReadable ? "border-error focus:border-error text-error" : "text-primary"
              }`}
            />
            <CopyButton text={cronExpression.trim()} size="md" variant="primary" />
          </div>
        </div>

        {/* Segmented Visual Inspector Cards */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 text-center">
          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-base-200/50 border border-base-content/5">
            <span className="text-[10px] sm:text-xs font-bold text-base-content/60 truncate uppercase">
              {t("fieldMinute")}
            </span>
            <input
              type="text"
              value={segments.minute}
              onChange={(e) => updateSegment(0, e.target.value)}
              className="input input-xs input-ghost font-mono text-center font-bold text-sm sm:text-base p-0 w-full focus:bg-base-100 focus:outline-primary"
            />
            <span className="text-[9px] text-base-content/40 font-mono">0-59</span>
          </div>

          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-base-200/50 border border-base-content/5">
            <span className="text-[10px] sm:text-xs font-bold text-base-content/60 truncate uppercase">
              {t("fieldHour")}
            </span>
            <input
              type="text"
              value={segments.hour}
              onChange={(e) => updateSegment(1, e.target.value)}
              className="input input-xs input-ghost font-mono text-center font-bold text-sm sm:text-base p-0 w-full focus:bg-base-100 focus:outline-primary"
            />
            <span className="text-[9px] text-base-content/40 font-mono">0-23</span>
          </div>

          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-base-200/50 border border-base-content/5">
            <span className="text-[10px] sm:text-xs font-bold text-base-content/60 truncate uppercase">
              {t("fieldDayMonth")}
            </span>
            <input
              type="text"
              value={segments.dayOfMonth}
              onChange={(e) => updateSegment(2, e.target.value)}
              className="input input-xs input-ghost font-mono text-center font-bold text-sm sm:text-base p-0 w-full focus:bg-base-100 focus:outline-primary"
            />
            <span className="text-[9px] text-base-content/40 font-mono">1-31</span>
          </div>

          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-base-200/50 border border-base-content/5">
            <span className="text-[10px] sm:text-xs font-bold text-base-content/60 truncate uppercase">
              {t("fieldMonth")}
            </span>
            <input
              type="text"
              value={segments.month}
              onChange={(e) => updateSegment(3, e.target.value)}
              className="input input-xs input-ghost font-mono text-center font-bold text-sm sm:text-base p-0 w-full focus:bg-base-100 focus:outline-primary"
            />
            <span className="text-[9px] text-base-content/40 font-mono">1-12</span>
          </div>

          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-base-200/50 border border-base-content/5">
            <span className="text-[10px] sm:text-xs font-bold text-base-content/60 truncate uppercase">
              {t("fieldDayWeek")}
            </span>
            <input
              type="text"
              value={segments.dayOfWeek}
              onChange={(e) => updateSegment(4, e.target.value)}
              className="input input-xs input-ghost font-mono text-center font-bold text-sm sm:text-base p-0 w-full focus:bg-base-100 focus:outline-primary"
            />
            <span className="text-[9px] text-base-content/40 font-mono">0-6 (Sun-Sat)</span>
          </div>
        </div>

        {/* Human Translation Hero Banner */}
        {humanReadable ? (
          <div className="alert alert-soft alert-success flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="icon-[lucide--sparkles] size-5 text-success shrink-0"></span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/60">
                  {t("humanTitle")}
                </span>
                <span className="font-semibold text-sm sm:text-base text-base-content leading-snug">
                  {humanReadable}
                </span>
              </div>
            </div>

            {upcomingDates.length > 0 && (
              <div className="flex items-center gap-2 bg-success/20 px-3 py-1.5 rounded-lg text-xs font-mono shrink-0">
                <span className="text-[11px] opacity-75">{t("nextRunLabel")}</span>
                <span className="font-bold text-success-content">
                  {formatCountdown(upcomingDates[0])}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="alert alert-soft alert-error text-xs p-3.5 flex items-center gap-2">
            <span className="icon-[lucide--alert-circle] size-4 shrink-0"></span>
            <span>{t("invalidCron")}</span>
          </div>
        )}

        {/* 1-Click Presets */}
        <div className="flex flex-col gap-2 pt-2 border-t border-base-content/10">
          <span className="text-xs font-semibold text-base-content/60">
            {t("presetsTitle")}
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => setCronExpression(preset.expression)}
                className={`btn btn-xs ${
                  cronExpression.trim() === preset.expression
                    ? "btn-primary font-bold shadow-sm"
                    : "btn-outline font-normal"
                } gap-1.5`}
              >
                <span>{t(preset.key)}</span>
                <span className="font-mono text-[10px] opacity-60">({preset.expression})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Split Section: Next Forecast Timeline + Snippets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Next Scheduled Runs Table */}
        <div className="lg:col-span-7 card card-border bg-base-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-base-content/10 flex items-center justify-between bg-base-200/40">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
              <span className="icon-[lucide--calendar-clock] size-4 text-primary"></span>
              {t("upcomingRunsTitle")}
            </span>
          </div>

          <div className="overflow-x-auto">
            {upcomingDates.length === 0 ? (
              <div className="p-8 text-center text-xs text-base-content/50 italic">
                {t("invalidCron")}
              </div>
            ) : (
              <table className="table table-xs font-mono">
                <thead>
                  <tr className="bg-base-200/60">
                    <th>#</th>
                    <th>{t("colTime")}</th>
                    <th>{t("colUtc")}</th>
                    <th className="text-right">{t("colCountdown")}</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingDates.map((date, idx) => (
                    <tr key={idx} className="hover:bg-base-200/40">
                      <td className="text-base-content/40 font-bold">{idx + 1}</td>
                      <td className="font-semibold text-base-content">
                        {date.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
                          dateStyle: "medium",
                          timeStyle: "medium",
                        })}
                      </td>
                      <td className="text-base-content/70">
                        {date.toISOString().replace("T", " ").substring(0, 19)} UTC
                      </td>
                      <td className="text-right">
                        <span className="badge badge-xs badge-soft badge-primary font-bold">
                          {formatCountdown(date)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Snippets Generator */}
        <div className="lg:col-span-5 card card-border bg-base-100 shadow-sm flex flex-col p-4 gap-3">
          <div className="flex items-center justify-between border-b border-base-content/10 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
              <span className="icon-[lucide--code-xml] size-4 text-primary"></span>
              {t("snippetsTitle")}
            </span>
            <CopyButton text={snippetCode} size="xs" variant="primary" />
          </div>

          {/* Snippet Format Selector */}
          <div className="join w-full grid grid-cols-3 bg-base-200/50 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveSnippetTab("crontab")}
              className={`btn btn-xs join-item ${
                activeSnippetTab === "crontab" ? "btn-primary shadow-sm" : "btn-ghost"
              }`}
            >
              {t("snippetCrontab")}
            </button>
            <button
              type="button"
              onClick={() => setActiveSnippetTab("gha")}
              className={`btn btn-xs join-item ${
                activeSnippetTab === "gha" ? "btn-primary shadow-sm" : "btn-ghost"
              }`}
            >
              {t("snippetGha")}
            </button>
            <button
              type="button"
              onClick={() => setActiveSnippetTab("k8s")}
              className={`btn btn-xs join-item ${
                activeSnippetTab === "k8s" ? "btn-primary shadow-sm" : "btn-ghost"
              }`}
            >
              {t("snippetK8s")}
            </button>
          </div>

          {/* Code Viewer */}
          <div className="relative">
            <textarea
              readOnly
              rows={activeSnippetTab === "crontab" ? 3 : 10}
              value={snippetCode}
              className="textarea textarea-bordered font-mono text-xs w-full bg-base-200/40 select-all leading-relaxed focus:outline-primary resize-none"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
