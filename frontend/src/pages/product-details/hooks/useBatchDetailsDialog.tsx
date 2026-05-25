import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { isCancel } from "axios";

import { createProductBatch, fetchProductBatchByCode, updateProductBatch } from "@/api/product-batches";
import { FORM_FIELD_TYPE } from "@/components/dynamic-form";
import type {
  DynamicFormLayoutItem,
  DynamicFormState,
  TextAsyncValidationConfig,
} from "@/components/dynamic-form/types";
import { getLocalIsoDateString } from "@/components/dynamic-form/validation";
import type { AppendixFieldRow } from "@/models/field.model";
import { isManualProduct, type Product } from "@/models/product.model";
import { BatchStatus, type ProductBatch } from "@/models/product-batch.model";

import { createBatchDetailsSchema } from "../utils/batch-details.schema";
import { isBatchCodeCharacterSetValid } from "@/lib/business/batch-code";
import type { AdditionalAttributeColumnSpec } from "../utils/batch-table";
import {
  apiManufacturingDateToFormDdMmYyyy,
  buildAdditionalAttributesFromExtraColumns,
  buildCreateProductBatchPayload,
  buildDefaultAttributes,
  buildDefaultExtraColumnsForEdit,
  buildDefaultExtraColumnsForCreate,
  buildUpdateProductBatchPayload,
  mapAppendixFieldsToFormLayout,
  type BatchDetailsFormValues,
} from "../utils/batch-form";
import {
  getManualDetailLinkFieldValidationState,
  getTraceabilityFieldValidationState,
} from "../utils/traceability-url-messages";

export const BATCH_DETAILS_FORM_ID = "product-batch-details-form";

export type BatchDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  mode: "create" | "edit";
  batch: ProductBatch | null;
  productId: string;
  appendixFields: AppendixFieldRow[];
  additionalAttributeColumnSpecs: AdditionalAttributeColumnSpec[];
};

function buildBatchDetailsDialogDefaultValues(
  mode: "create" | "edit",
  batch: ProductBatch | null,
  appendixFields: AppendixFieldRow[],
  additionalAttributeColumnSpecs: AdditionalAttributeColumnSpec[]
): BatchDetailsFormValues {
  const attributes = buildDefaultAttributes(mode, batch, appendixFields);
  const extraColumns =
    mode === "create"
      ? buildDefaultExtraColumnsForCreate(additionalAttributeColumnSpecs)
      : batch
        ? buildDefaultExtraColumnsForEdit(batch, additionalAttributeColumnSpecs)
        : [];
  if (mode === "edit" && batch) {
    return {
      batch_code: batch.batch_code?.trim() ?? "",
      manufacturing_date: apiManufacturingDateToFormDdMmYyyy(batch.manufacturing_date),
      total_quantity:
        batch.total_quantity != null && !Number.isNaN(Number(batch.total_quantity))
          ? String(batch.total_quantity)
          : "",
      traceability_url: batch.traceability_url?.trim() ?? "",
      attributes,
      extraColumns,
    };
  }
  return {
    batch_code: "",
    manufacturing_date: "",
    total_quantity: "",
    traceability_url: "",
    attributes,
    extraColumns,
  };
}

export function useBatchDetailsDialog({
  open,
  onOpenChange,
  product,
  mode,
  batch,
  productId,
  appendixFields,
  additionalAttributeColumnSpecs,
}: BatchDetailsDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [publishedBatchSeriesEdited, setPublishedBatchSeriesEdited] = useState(false);

  const originalBatchCode = useMemo(
    () => (mode === "edit" && batch ? batch.batch_code.trim() : ""),
    [mode, batch]
  );

  const onFormStateChange = useCallback(
    (state: DynamicFormState<BatchDetailsFormValues>) => {
      setIsFormSubmitting(state.isSubmitting);
      setIsFormValid(state.isValid);
      const isPublishedEdit =
        mode === "edit" &&
        batch &&
        batch.status?.trim().toLowerCase() === BatchStatus.PUBLISHED;
      if (!isPublishedEdit || !originalBatchCode) {
        setPublishedBatchSeriesEdited(false);
        return;
      }
      const current = (state.methods.getValues("batch_code") ?? "").trim();
      setPublishedBatchSeriesEdited(current !== originalBatchCode);
    },
    [mode, batch, originalBatchCode]
  );

  const formKey = useMemo(() => {
    const appendixKey = appendixFields.map((f) => f.field_id).join(",");
    const extraKey = additionalAttributeColumnSpecs.map((s) => s.fieldCode).join("|");
    return `${open ? "1" : "0"}-${i18n.language}-${mode}-${batch?.id ?? "new"}-${appendixKey}-${extraKey}`;
  }, [open, i18n.language, mode, batch?.id, appendixFields, additionalAttributeColumnSpecs]);

  const defaultValues = useMemo(
    () =>
      buildBatchDetailsDialogDefaultValues(
        mode,
        batch,
        appendixFields,
        additionalAttributeColumnSpecs
      ),
    [mode, batch, appendixFields, additionalAttributeColumnSpecs]
  );

  const savedExtraColumnFieldCodes = useMemo(() => {
    const next = new Set<string>();
    if (mode === "edit" && batch) {
      for (const spec of additionalAttributeColumnSpecs) {
        const code = spec.fieldCode?.trim() ?? "";
        if (code) next.add(code);
      }
      for (const a of batch.additional_attributes ?? []) {
        const code = (a.field_code ?? "").trim();
        if (code) next.add(code);
      }
    } else if (mode === "create") {
      for (const spec of additionalAttributeColumnSpecs) {
        const code = spec.fieldCode?.trim() ?? "";
        if (code) next.add(code);
      }
    }
    return next;
  }, [mode, batch, additionalAttributeColumnSpecs]);

  const productIsManual = useMemo(() => isManualProduct(product), [product]);

  const batchSchema = useMemo(
    () =>
      createBatchDetailsSchema({
        t,
        mode,
        productGtin: product.gtin,
        appendixFields,
        isManualProduct: productIsManual,
      }),
    [t, mode, product.gtin, appendixFields, productIsManual]
  );

  const batchCodeTextAsyncValidation = useMemo((): TextAsyncValidationConfig<BatchDetailsFormValues> => {
    return {
      debounceMs: 400,
      validatingMessage: t("product.detail.batch.dialog.batchCodeValidating"),
      validate: async (value, { signal }) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return true;
        }
        if (!isBatchCodeCharacterSetValid(value)) {
          return t("product.detail.batch.dialog.batchCodeInvalidCharacters");
        }
        try {
          const found = await fetchProductBatchByCode(productId, trimmed, signal);
          if (!found) {
            return true;
          }
          if (mode === "edit" && batch && found.id === batch.id) {
            return true;
          }
          return t("product.detail.batch.dialog.batchCodeNotUnique");
        } catch (error) {
          if (isCancel(error)) {
            return true;
          }
          return t("common.error");
        }
      },
    };
  }, [t, productId, mode, batch]);

  const fields = useMemo((): DynamicFormLayoutItem<BatchDetailsFormValues>[] => {
    const base: DynamicFormLayoutItem<BatchDetailsFormValues>[] = [
      {
        type: FORM_FIELD_TYPE.TEXT,
        name: "batch_code",
        label: t("product.detail.batch.dialog.fieldBatchCode"),
        placeholder: t("product.detail.batch.dialog.placeholderBatchCode"),
        required: t("product.detail.batch.dialog.batchCodeRequired"),
        maxLength: 200,
        textAsyncValidation: batchCodeTextAsyncValidation,
      },
      {
        type: FORM_FIELD_TYPE.DATE,
        name: "manufacturing_date",
        label: t("product.detail.batch.dialog.fieldMfg"),
        placeholder: t("product.detail.batch.datePlaceholder"),
        required: t("product.detail.batch.dialog.fieldRequired"),
        datePickerMax: getLocalIsoDateString(),
      },
      {
        type: FORM_FIELD_TYPE.TEXT,
        name: "total_quantity",
        label: t("product.detail.batch.dialog.fieldQty"),
        hint: t("product.detail.batch.dialog.optional"),
        inputType: "number",
        placeholder: t("product.detail.batch.dialog.placeholderQty"),
      },
      {
        type: FORM_FIELD_TYPE.TEXT,
        name: "traceability_url",
        label: productIsManual
          ? t("product.detail.batch.dialog.fieldDetailLink")
          : t("product.detail.batch.dialog.fieldTraceability"),
        hint: t("product.detail.batch.dialog.optional"),
        placeholder: productIsManual
          ? t("productCreate.step3.cellPlaceholderProductDetailsUrl")
          : t("productCreate.step3.cellPlaceholderTraceability"),
        inputType: "url",
        fieldValidationDependencies: productIsManual ? [] : ["batch_code"],
        getFieldValidationState: (m) => {
          const url = m.getValues("traceability_url") ?? "";
          if (productIsManual) {
            return getManualDetailLinkFieldValidationState(t, url);
          }
          const lotForUrl = (m.getValues("batch_code") ?? "").trim();
          return getTraceabilityFieldValidationState(t, url, product.gtin, lotForUrl);
        },
      },
    ];

    return [...base, ...mapAppendixFieldsToFormLayout(t, appendixFields, i18n.language)];
  }, [
    t,
    i18n.language,
    appendixFields,
    product.gtin,
    batchCodeTextAsyncValidation,
    productIsManual,
  ]);

  const onSubmit = useCallback(
    async (values: BatchDetailsFormValues) => {
      const code = values.batch_code.trim();
      const additionalAttributes = buildAdditionalAttributesFromExtraColumns(values.extraColumns);

      if (mode === "create") {
        const payload = buildCreateProductBatchPayload(
          productId,
          values,
          appendixFields,
          additionalAttributes
        );
        await createProductBatch(productId, payload);
      } else if (mode === "edit" && batch) {
        const payload = buildUpdateProductBatchPayload(
          values,
          appendixFields,
          additionalAttributes,
          batch.inter_industry_attributes ?? []
        );
        await updateProductBatch(productId, batch.id, payload);
      } else {
        return;
      }

      toast.success(
        mode === "create"
          ? t("product.detail.batch.dialog.toastCreateSuccess", { code })
          : t("product.detail.batch.dialog.toastUpdateSuccess", { code })
      );
      await queryClient.invalidateQueries({
        queryKey: ["product-batches", productId],
      });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    },
    [t, mode, productId, batch, appendixFields, queryClient, onOpenChange]
  );

  const dialogDescriptionText = useMemo(
    () => t("product.detail.batch.dialog.description"),
    [t]
  );
  const publishedBatchSeriesWarningText = useMemo(
    () => t("product.detail.batch.dialog.publishedBatchSeriesChangeWarning"),
    [t]
  );

  const dialogTitle = useMemo(
    () =>
      mode === "create"
        ? t("product.detail.batch.dialog.titleAdd")
        : t("product.detail.batch.dialog.titleEdit"),
    [mode, t]
  );

  const onCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return {
    formId: BATCH_DETAILS_FORM_ID,
    open,
    onOpenChange,
    dialogTitle,
    dialogDescriptionText,
    publishedBatchSeriesEdited,
    publishedBatchSeriesWarningText,
    onCancel,
    formKey,
    defaultValues,
    fields,
    batchSchema,
    onFormStateChange,
    onSubmit,
    isFormSubmitting,
    isFormValid,
    savedExtraColumnFieldCodes,
    t,
  };
}
