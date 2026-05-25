import { cn } from "@/lib/utils";
import { useAppVersion } from "@/hooks/useAppVersion";

type LoginVersionBadgeProps = {
  className?: string;
};

export function LoginVersionBadge({ className }: LoginVersionBadgeProps) {
  const versionLabel = useAppVersion();

  if (!versionLabel) return null;

  return (
    <p
      className={cn(
        "pointer-events-none select-none text-xs tabular-nums text-muted-foreground",
        className
      )}
      aria-label={`Version ${versionLabel}`}
    >
      {versionLabel}
    </p>
  );
}
