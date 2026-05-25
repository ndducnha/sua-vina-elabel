import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
};

/**
 * Status pill for column headers
 */
export function HeaderChip({ text, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none",
        "border-[#ADCDEE] bg-[#EEF4FB] text-[#2F76C9]",
        className,
      )}
    >
      {text}
    </span>
  );
}
