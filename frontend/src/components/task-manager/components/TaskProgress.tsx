export type TaskProgressVariant = "circle" | "arc";

type TaskProgressProps = {
  variant: TaskProgressVariant;
  percent?: number;
  /** Arc: shown above %; circle: optional aria-label when provided */
  label?: string;
};

function clampPercent(percent: number | undefined): number {
  return Math.min(100, Math.max(0, percent ?? 0));
}

/** Compact ring — e.g. minimized task toast */
function TaskProgressCircle({ percent, label }: { percent: number; label: string }) {
  const radius = 25;
  const strokeWidth = 6;
  const size = radius * 2 + strokeWidth * 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * percent) / 100;

  return (
    <div
      className="flex items-center justify-center rounded-xl"
      role="img"
      aria-label={label || undefined}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E1E4ED"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2F76C9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-sm font-bold text-gray-900">{Math.round(percent)}%</p>
        </div>
      </div>
    </div>
  );
}

/** Semi-circle arc — task detail modal (`pathLength` keeps dash aligned with %) */
function TaskProgressArc({ percent, label }: { percent: number; label: string }) {
  const pathLen = 100;
  const dashOffset = pathLen - (pathLen * percent) / 100;

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <svg width="160" height="88" viewBox="0 0 160 88" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            pathLength={pathLen}
            d="M152 80C152 70.5448 150.138 61.1822 146.519 52.4468C142.901 43.7114 137.598 35.7741 130.912 29.0883C124.226 22.4025 116.289 17.099 107.553 13.4807C98.8178 9.86234 89.4552 8 80 8C70.5448 7.99999 61.1823 9.86232 52.4468 13.4807C43.7114 17.099 35.7742 22.4025 29.0883 29.0883C22.4025 35.7741 17.099 43.7113 13.4807 52.4468C9.86234 61.1822 8 70.5448 8 80"
            stroke="#E1E4ED"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            pathLength={pathLen}
            d="M8 80C8 70.5448 9.86234 61.1822 13.4807 52.4468C17.099 43.7113 22.4025 35.7741 29.0883 29.0883C35.7742 22.4025 43.7114 17.099 52.4468 13.4807C61.1823 9.86232 70.5448 7.99999 80 8C89.4552 8 98.8178 9.86234 107.553 13.4807C116.289 17.099 124.226 22.4025 130.912 29.0883C137.598 35.7741 142.901 43.7114 146.519 52.4468C150.138 61.1822 152 70.5448 152 80"
            stroke="#2F76C9"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLen}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end">
          <p className="text-sm font-medium text-gray-500 leading-tight">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{Math.round(percent)}%</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Shared task progress UI: toast uses a compact ring, modal uses a semi-circle arc.
 */
export function TaskProgress({ variant, percent = 0, label = "" }: TaskProgressProps) {
  const p = clampPercent(percent);
  return variant === "circle" ? (
    <TaskProgressCircle percent={p} label={label} />
  ) : (
    <TaskProgressArc percent={p} label={label} />
  );
}
