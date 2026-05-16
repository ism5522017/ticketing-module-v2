import { cn } from "@/lib/utils";

const STAGES = ["Review", "Approved", "In Progress", "Resolved"] as const;

export function ProgressStepper({ activeStage }: { activeStage: number }) {
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((label, i) => (
        <div key={label} className="flex flex-1 items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                i < activeStage
                  ? "bg-status-resolved text-white"
                  : i === activeStage
                    ? "bg-deh-blue text-white"
                    : "bg-deh-gray-200 text-deh-muted",
              )}
            >
              {i < activeStage ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium",
                i === activeStage
                  ? "text-deh-blue"
                  : i < activeStage
                    ? "text-status-resolved"
                    : "text-deh-muted",
              )}
            >
              {label}
            </span>
          </div>
          {i < STAGES.length - 1 ? (
            <div className="mx-1 mb-4 h-0.5 flex-1 bg-deh-gray-200">
              <div
                className={cn(
                  "h-full transition-all",
                  i < activeStage ? "w-full bg-status-resolved" : "w-0",
                )}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
