import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogLayout } from "@/components/dialog/DialogLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddImagePayload = {
  url: string;
  note: string | null;
};

export type AddImageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onSave: (payload: AddImagePayload) => Promise<void>;
};

/**
 * Add product image by URL + optional note. Uses {@link DialogLayout} for shell and actions.
 */
export function AddImageDialog({
  open,
  onOpenChange,
  isSaving,
  onSave,
}: AddImageDialogProps) {
  const { t } = useTranslation();
  const [urlDraft, setUrlDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [previewBroken, setPreviewBroken] = useState(false);

  useEffect(() => {
    if (open) {
      setUrlDraft("");
      setNoteDraft("");
      setPreviewBroken(false);
    }
  }, [open]);

  const urlTrimmed = urlDraft.trim();
  const canSaveAdd = urlTrimmed.length > 0;

  const handleSave = async () => {
    if (!canSaveAdd) return;
    await onSave({
      url: urlTrimmed,
      note: noteDraft.trim() ? noteDraft.trim() : null,
    });
  };

  return (
    <DialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title={t("product.detail.images.addModalTitle")}
      description={t("product.detail.images.addModalDescription")}
      size="full"
      className="w-[min(70vw,36rem)] max-w-176!"
      actions={{
        cancel: {
          text: t("common.cancel"),
          onClick: () => onOpenChange(false),
        },
        confirm: {
          text: t("product.detail.images.saveAdd"),
          loading: isSaving,
          loadingText: t("common.saving"),
          disabled: !canSaveAdd,
          onClick: () => void handleSave(),
        },
      }}
    >
      <div className="flex flex-col gap-4 px-1">
        <div className="space-y-2">
          <Label htmlFor="gallery-image-url">{t("product.detail.images.urlLabel")}</Label>
          <Input
            id="gallery-image-url"
            type="url"
            autoComplete="off"
            placeholder={t("product.detail.images.urlPlaceholder")}
            value={urlDraft}
            onChange={(e) => {
              setUrlDraft(e.target.value);
              setPreviewBroken(false);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gallery-image-note">{t("product.detail.images.noteLabel")}</Label>
          <textarea
            id="gallery-image-note"
            rows={3}
            placeholder={t("product.detail.images.notePlaceholder")}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            className="border-input bg-transparent placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="">
          <p className="text-muted-foreground mb-2 text-xs font-medium">
            {t("product.detail.images.previewHeading")}
          </p>
          <div className="bg-background flex min-h-[120px] items-center justify-center overflow-hidden rounded-md border">
            {urlTrimmed ? (
              previewBroken ? (
                <p className="text-muted-foreground px-4 text-center text-sm">
                  {t("product.detail.images.previewError")}
                </p>
              ) : (
                <img
                  src={urlTrimmed}
                  alt=""
                  className="max-h-48 w-full object-contain"
                  onError={() => setPreviewBroken(true)}
                  onLoad={() => setPreviewBroken(false)}
                />
              )
            ) : (
              <p className="text-muted-foreground text-sm">{t("product.detail.images.previewPlaceholder")}</p>
            )}
          </div>
        </div>
      </div>
    </DialogLayout>
  );
}
