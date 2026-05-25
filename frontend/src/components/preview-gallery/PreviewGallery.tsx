import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type PreviewGalleryImage = {
  src: string;
  alt?: string;
};

export type PreviewGalleryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: PreviewGalleryImage[];
  /** Visible slide when opening. Clamped into range when `images` changes or preview opens. */
  initialIndex?: number;
  /** Accessible labels for built-in controls. */
  labels: {
    close: string;
    previous: string;
    next: string;
    dialogTitle: string;
  };
};

export function PreviewGallery({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
  labels,
}: PreviewGalleryProps) {
  const count = images.length;
  const [index, setIndex] = React.useState(0);

  React.useLayoutEffect(() => {
    if (!open || count === 0) return;
    setIndex(Math.max(0, Math.min(initialIndex, count - 1)));
  }, [open, initialIndex, count]);

  React.useEffect(() => {
    if (!open || count <= 1) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => Math.min(count - 1, i + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, count]);

  if (count === 0) {
    return null;
  }

  const current = images[index];
  if (!current) {
    return null;
  }

  const canPrev = index > 0;
  const canNext = index < count - 1;

  const goPrev = () => canPrev && setIndex((i) => i - 1);
  const goNext = () => canNext && setIndex((i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-50 bg-black/82 supports-backdrop-filter:backdrop-blur-xs" />

        <DialogPrimitive.Popup
          data-slot="preview-gallery-popup"
          className={cn(
            "fixed inset-0 z-[51] flex flex-col outline-none",
            "data-open:animate-in data-open:fade-in-0",
            "data-closed:animate-out data-closed:fade-out-0"
          )}
        >
          <DialogTitle className="sr-only">{labels.dialogTitle}</DialogTitle>
          <div className="flex min-h-0 flex-1 flex-col p-4 pt-3 md:p-6">
            <div className="relative flex shrink-0 justify-end pb-2">
              <DialogPrimitive.Close
                render={<Button variant="ghost" size="icon" className="text-white hover:bg-white/15 shrink-0" />}
                aria-label={labels.close}
              >
                <X className="size-5" aria-hidden />
              </DialogPrimitive.Close>
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 items-center gap-2 md:gap-4">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className={cn(
                  "shrink-0 rounded-full text-white hover:bg-white/15 disabled:opacity-30",
                  "hidden sm:inline-flex",
                  count <= 1 && "invisible"
                )}
                disabled={!canPrev}
                onClick={goPrev}
                aria-label={labels.previous}
              >
                <ChevronLeft className="size-8" aria-hidden />
              </Button>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3">
                <div className="flex max-h-[min(78vh,calc(100dvh-7rem))] w-full items-center justify-center">
                  <img
                    src={current.src}
                    alt={current.alt ?? ""}
                    className="max-h-[min(78vh,calc(100dvh-7rem))] max-w-full object-contain"
                    decoding="async"
                  />
                </div>
                {count > 1 ? (
                  <p className="text-muted-foreground text-xs tabular-nums">
                    <span className="text-white/90">
                      {index + 1} / {count}
                    </span>
                  </p>
                ) : null}

                <div className={cn("flex gap-6 sm:hidden", count <= 1 && "hidden")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-white hover:bg-white/15"
                    disabled={!canPrev}
                    onClick={goPrev}
                  >
                    <ChevronLeft className="size-5 shrink-0" aria-hidden />
                    <span className="sr-only">{labels.previous}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-white hover:bg-white/15"
                    disabled={!canNext}
                    onClick={goNext}
                  >
                    <ChevronRight className="size-5 shrink-0" aria-hidden />
                    <span className="sr-only">{labels.next}</span>
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className={cn(
                  "shrink-0 rounded-full text-white hover:bg-white/15 disabled:opacity-30",
                  "hidden sm:inline-flex",
                  count <= 1 && "invisible"
                )}
                disabled={!canNext}
                onClick={goNext}
                aria-label={labels.next}
              >
                <ChevronRight className="size-8" aria-hidden />
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
