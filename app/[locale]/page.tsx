// app/page.tsx
import DashboardGrid from "@/app/components/DashboardGridComponent";
import { AVAILABLE_TOOLS } from "@/app/lib/tools";

export default function Home() {
  return (
    <div className="max-w-7xl w-full mx-auto p-6 md:p-8">
      <DashboardGrid apps={AVAILABLE_TOOLS} />
    </div>
  );
}
