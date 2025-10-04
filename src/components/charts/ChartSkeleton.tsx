import React from "react";

interface ChartSkeletonProps {
  height?: number;
  variant?: "line" | "donut" | "bar" | "radar" | "kpi";
  className?: string;
}

const shimmer = "animate-pulse";

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  height = 260,
  variant = "line",
  className = "",
}) => {
  const base =
    "rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 overflow-hidden relative";
  return (
    <div
      className={`${base} ${className}`}
      style={{ height }}
      aria-label="Loading chart"
      role="status"
    >
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_70%_30%,#0ea5e9,transparent_60%)]" />
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded bg-slate-200/80" />
          <div className="h-3 w-40 rounded bg-slate-200/80" />
        </div>
        <div className="flex-1 relative">
          {variant === "line" && (
            <div className="h-full flex items-end gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${shimmer} bg-slate-200/70 rounded-t`}
                  style={{ height: `${20 + (i % 5) * 10}%` }}
                />
              ))}
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-200" />
            </div>
          )}
          {variant === "donut" && (
            <div className="h-full flex items-center justify-center">
              <div
                className={`relative ${shimmer} w-40 h-40 rounded-full bg-gradient-to-br from-slate-200 to-slate-100`}
              >
                <div className="absolute inset-6 rounded-full bg-white/70" />
              </div>
            </div>
          )}
          {variant === "bar" && (
            <div className="h-full flex items-end gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${shimmer} rounded bg-slate-200/70`}
                  style={{ height: `${30 + (i % 4) * 12}%` }}
                />
              ))}
            </div>
          )}
          {variant === "radar" && (
            <div className="h-full flex items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 rounded-full border border-slate-200/70" />
                <div className="absolute inset-6 rounded-full border border-slate-200/60" />
                <div className="absolute inset-12 rounded-full border border-slate-200/50" />
                <div className="absolute inset-0 origin-center translate-x-1/2 translate-y-1/2 -left-1/2 -top-1/2 w-px h-full bg-slate-200/60 rotate-45" />
                <div className="absolute inset-0 origin-center translate-x-1/2 translate-y-1/2 -left-1/2 -top-1/2 w-px h-full bg-slate-200/60 -rotate-45" />
                <div
                  className={`absolute inset-0 m-auto w-20 h-20 bg-slate-200/70 ${shimmer} clip-path-polygon`}
                />
              </div>
            </div>
          )}
          {variant === "kpi" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="relative rounded-xl border border-slate-200 bg-white/60 p-3"
                >
                  <div className="h-2 w-16 bg-slate-200/80 rounded mb-2" />
                  <div className="h-4 w-12 bg-slate-200/80 rounded mb-1" />
                  <div className="h-2 w-10 bg-slate-200/60 rounded" />
                  <div className="absolute bottom-1 left-1 right-1 h-5 bg-slate-200/40 rounded" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default ChartSkeleton;
