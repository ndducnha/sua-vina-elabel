import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { nextExtraColumnIndex, type BatchDetailsFormValues } from "../../utils/batch-form";

type BatchExtraColumnsEditorProps = {
  /** Persisted-from-server/spec `field_code`s; those rows cannot rename field name or delete. */
  savedExtraColumnFieldCodes: ReadonlySet<string>;
};

/**
 * User-defined extra `additional_attributes` rows (`field_code` = `extraColumn{n}`).
 * Must be rendered inside the same `FormProvider` as the batch details form.
 */
export function BatchExtraColumnsEditor({
  savedExtraColumnFieldCodes,
}: BatchExtraColumnsEditorProps) {
  const { t } = useTranslation();
  const {
    control,
    register,
    getValues,
    formState: { errors },
  } = useFormContext<BatchDetailsFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "extraColumns" });
  const extraColumnsWatched = useWatch({ control, name: "extraColumns" });

  const onAdd = () => {
    const n = nextExtraColumnIndex(getValues("extraColumns") ?? []);
    append({ field_code: `extraColumn${n}`, field_name: "", field_value: "" });
  };

  return (
    <div className="space-y-3">
      {fields.length > 0 ? (
        <ul className="list-none space-y-3" aria-label={t("product.detail.batch.dialog.extraFieldsSection")}>
          {fields.map((field, index) => {
            const nameErr = errors.extraColumns?.[index]?.field_name;
            const valueErr = errors.extraColumns?.[index]?.field_value;
            const fieldCode = (extraColumnsWatched?.[index]?.field_code ?? "").trim();
            const persistedRow = savedExtraColumnFieldCodes.has(fieldCode);
            return (
              <li
                key={field.id}
                className="w-full"
              >
                <input type="hidden" {...register(`extraColumns.${index}.field_code`)} />
                <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2">
                  <div className="min-w-0 space-y-1">
                    <Input
                      id={`batch-extra-name-${field.id}`}
                      className={cn(
                        "w-full",
                        nameErr && "border-destructive aria-invalid:ring-destructive/20"
                      )}
                      aria-label={t("product.detail.batch.dialog.extraFieldName")}
                      aria-invalid={nameErr ? true : undefined}
                      autoComplete="off"
                      disabled={persistedRow}
                      {...register(`extraColumns.${index}.field_name`)}
                      placeholder={t("product.detail.batch.dialog.extraFieldNamePlaceholder")}
                    />
                    {nameErr?.message != null && (
                      <p className="text-destructive text-xs">{nameErr.message}</p>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <Input
                      id={`batch-extra-value-${field.id}`}
                      className={cn(
                        "w-full",
                        valueErr && "border-destructive aria-invalid:ring-destructive/20"
                      )}
                      aria-label={t("product.detail.batch.dialog.extraFieldValue")}
                      aria-invalid={valueErr ? true : undefined}
                      autoComplete="off"
                      {...register(`extraColumns.${index}.field_value`)}
                      placeholder={t("product.detail.batch.dialog.extraFieldValuePlaceholder")}
                    />
                    {valueErr?.message != null && (
                      <p className="text-destructive text-xs">{valueErr.message}</p>
                    )}
                  </div>
                  <div className="flex justify-start">
                    {!persistedRow ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground"
                        onClick={() => remove(index)}
                        aria-label={t("product.detail.batch.dialog.extraFieldRemove")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled
                        className="h-8 w-8 shrink-0 pointer-events-none"
                        title={t("product.detail.batch.dialog.extraFieldRemoveLocked")}
                        tabIndex={-1}
                        aria-label={t("product.detail.batch.dialog.extraFieldRemoveLocked")}
                      >
                        <Trash2 className="size-4 opacity-30" />
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={onAdd}
      >
        <Plus className="size-4" />
        {t("product.detail.batch.dialog.addField")}
      </Button>
    </div>
  );
}
