import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "@/lib/utils";

// Size presets
const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-[90vw]",
};

export interface DialogActionConfig {
  text: string;
  onClick?: (() => void) | null;
  disabled?: boolean;
  disabledTooltip?: string;
  className?: string;
}

export interface DialogConfirmActionConfig extends DialogActionConfig {
  variant?: "default" | "destructive" | "warning";
  loading?: boolean;
  loadingText?: string;
  className?: string;
}

export interface DialogLayoutProps {
  // Core props
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Header props
  title?: string;
  description?: React.ReactNode;
  titleClassName?: string;

  // Content
  children?: React.ReactNode;

  // Footer props
  footer?: React.ReactNode;

  // Actions (alternative to custom footer)
  actions?: {
    cancel?: DialogActionConfig;
    confirm?: DialogConfirmActionConfig;
  };

  // Styling
  size?: keyof typeof sizeClasses;
  className?: string;
  contentClassName?: string;
  mode?: "default" | "message";

  // Behavior
  showCloseButton?: boolean;
  preventOutsideClick?: boolean;
  preventAutoFocus?: boolean;
  footerAlign?: "right" | "between" | "center";
  revertFooter?: boolean;
  headerActions?: React.ReactNode;
}

export function DialogLayout({
  open,
  onOpenChange,
  title,
  description,
  titleClassName,
  children,
  footer,
  actions,
  size = "md",
  className,
  contentClassName,
  mode = "default",
  showCloseButton = true,
  preventOutsideClick = true,
  // preventAutoFocus = false,
  footerAlign = "right",
  revertFooter = false,
  // headerActions
}: DialogLayoutProps) {
  const isMessage = mode === "message";
  const handleCancel = () => {
    if (actions?.cancel?.onClick) actions?.cancel?.onClick?.();
    else onOpenChange(false);
  };

  const handleConfirm = () => {
    actions?.confirm?.onClick?.();
  };

  // Render cancel button with optional tooltip
  const renderCancelButton = () => {
    const config = actions?.cancel;
    if (!config) return null;

    const isDisabled = config.disabled;

    const button = (
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        disabled={isDisabled}
        className={cn(
          "px-4 py-2 bg-white text-black hover:opacity-90",
          config.className,
        )}
      >
        {config.text}
      </Button>
    );

    if (isDisabled && config.disabledTooltip) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <span className="inline-block">{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.disabledTooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  // Render confirm button with optional tooltip
  const renderConfirmButton = () => {
    const config = actions?.confirm;
    if (!config) return null;

    const isDisabled = config.disabled || config.loading;
    const buttonText = config.loading
      ? config.loadingText || config.text
      : config.text;

    const button = (
      <Button
        type="submit"
        variant={config.variant === "destructive" ? "destructive" : config.variant === "warning" ? "warning" : "default"}
        onClick={handleConfirm}
        disabled={isDisabled}
        className={cn(
          "px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
          config.variant === "destructive"
            ? "bg-red-600 hover:bg-red-700"
            : config.variant === "warning"
            ? "text-red-500"
            : "",
          config.className,
        )}
      >
        {config.loading && (
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {buttonText}
      </Button>
    );

    if (isDisabled && config.disabledTooltip) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <span className="inline-block">{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.disabledTooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      disablePointerDismissal={preventOutsideClick}
    >
      <DialogContent
        className={cn(sizeClasses[size], className)}
        showCloseButton={showCloseButton}
      >
        {isMessage && children && (
          <div className={cn("py-2 min-w-0", contentClassName)}>
            {children}
          </div>
        )}

        {(title || description) && (
          <DialogHeader
            className={cn("min-w-0", isMessage && "items-center text-center")}
          >
            {title && (
              <DialogTitle
                className={cn(
                  "text-xl font-semibold min-w-0 wrap-break-word",
                  isMessage && "text-center",
                  titleClassName,
                )}
              >
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription
                className={cn(
                  "text-muted-foreground min-w-0 wrap-break-word",
                  isMessage && "text-center",
                )}
              >
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        {!isMessage && children && (
          <div className={cn("py-2 min-w-0 max-h-[70dvh] overflow-auto", contentClassName)}>
            {children}
          </div>
        )}

        {/* Footer */}
        {(footer || actions) && (
          <DialogFooter
            className={cn(
              footerAlign === "right"
                ? "flex items-center min-w-0"
                : "flex space-x-3 min-w-0",
              isMessage && "justify-center sm:justify-center",
              footerAlign === "right" && "justify-end",
              footerAlign === "center" && "justify-center gap-3",
            )}
          >
            {footer ||
              (footerAlign === "between" && revertFooter ? (
                <>
                  {renderConfirmButton()}
                  <div className="ml-auto">{renderCancelButton()}</div>
                </>
              ) : (
                <>
                  {renderCancelButton()}
                  {renderConfirmButton()}
                </>
              ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DialogLayout;
