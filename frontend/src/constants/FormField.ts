export const CATEGORY_FIELDS = [
  { key: "segment", label: "productCreate.step2.block_1.segment" },
  { key: "category", label: "productCreate.step2.block_1.commodityGroup" },
  { key: "subCategory", label: "productCreate.step2.block_1.productType" },
  { key: "brick", label: "productCreate.step2.block_1.brick" },
  { key: "productGroup", label: "productCreate.step2.block_1.productCategoryName" },
] as const;

export const REQUIRED_FIELDS = [
  { name: "volume", label: "Định lượng" },
  { name: "ingredient", label: "Thành phần" },
  { name: "warning", label: "Cảnh báo" },
  { name: "usage", label: "Hướng dẫn sử dụng" },
] as const;

export const RISK_LEVEL = {
  LOW: 3,
  MEDIUM: 2,
  HIGH: 1,
  UNDETERMINED: 0,
};
