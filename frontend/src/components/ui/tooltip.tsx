import { PreviewCard } from "@base-ui/react/preview-card";

import { cn } from "@/lib/utils";

function Tooltip({ ...props }: PreviewCard.Root.Props) {
  return <PreviewCard.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
  className,
  delay = 250,
  closeDelay = 120,
  children,
  ...props
}: PreviewCard.Trigger.Props) {
  return (
    <PreviewCard.Trigger
      data-slot="tooltip-trigger"
      delay={delay}
      closeDelay={closeDelay}
      {...props}
      render={(triggerProps) => (
        <span {...triggerProps} className={cn("inline-flex min-w-0", className, triggerProps.className)}>
          {children}
        </span>
      )}
    />
  );
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  align = "center",
  children,
  ...props
}: PreviewCard.Popup.Props &
  Pick<PreviewCard.Positioner.Props, "side" | "sideOffset" | "align">) {
  return (
    <PreviewCard.Portal>
      <PreviewCard.Positioner
        className="isolate z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
        align={align}
      >
        <PreviewCard.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 max-w-xs rounded-md border border-border bg-tooltip-popover px-3 py-1.5 text-xs text-pretty text-tooltip-popover-foreground shadow-md outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
        </PreviewCard.Popup>
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent };
