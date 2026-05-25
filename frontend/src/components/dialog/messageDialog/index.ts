export { MessageDialog } from "./MessageDialog";
export {
  messageDialogService,
  useMessageDialogStore,
  mergeMessageDialogContent,
} from "./messageDialogService";


import type { ReactNode } from "react";

export type MessageDialogContext = "warning" | "normal" | "error";

export type MessageDialogConfirmConfig = {
  enable?: boolean; // Default: `true`. `false` — disable confirm button
  text: string;
  onSubmit: () => void | Promise<void>; // Can be `async`. After success, service will `close` (inside the package from `open`).
};

export type MessageDialogContentConfig = {
  context: MessageDialogContext;
  title: string;
  message: ReactNode;
  cancelText: string;
  confirmButton: MessageDialogConfirmConfig;
};

/**
 * Options from caller; merge with default before opening.
 */
export type OpenMessageDialogOptions = {
  context?: MessageDialogContext;
  title: string;
  message: ReactNode;
  cancelText?: string;
  confirmButton: MessageDialogConfirmConfig;
};

export const DEFAULT_MESSAGE_DIALOG_CONFIG = {
  context: "normal" as MessageDialogContext,
  cancelText: "Hủy",
  confirm: { enable: true as boolean },
} as const;