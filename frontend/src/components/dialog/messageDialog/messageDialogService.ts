import { create } from "zustand";
import { DEFAULT_MESSAGE_DIALOG_CONFIG } from ".";
import type { MessageDialogContentConfig, OpenMessageDialogOptions } from ".";

/**
 * Merge options with default configuration.
 */
export function mergeMessageDialogContent(
  options: OpenMessageDialogOptions,
  onSubmit: () => void | Promise<void>,
): MessageDialogContentConfig {
  return {
    context: options.context ?? DEFAULT_MESSAGE_DIALOG_CONFIG.context,
    title: options.title,
    message: options.message,
    cancelText: options.cancelText ?? DEFAULT_MESSAGE_DIALOG_CONFIG.cancelText,
    confirmButton: {
      enable: options.confirmButton.enable ?? DEFAULT_MESSAGE_DIALOG_CONFIG.confirm.enable,
      text: options.confirmButton.text,
      onSubmit,
    },
  };
}

type MessageDialogState = {
  isOpen: boolean;
  content: MessageDialogContentConfig | null;
  openMessageDialog: (options: OpenMessageDialogOptions) => void;
  closeMessageDialog: () => void;
};

/**
 * Message dialog store.
 */
export const useMessageDialogStore = create<MessageDialogState>((set, get) => ({
  isOpen: false,
  content: null,
  openMessageDialog: (raw) => {
    const userSubmit = raw.confirmButton.onSubmit;
    set({
      isOpen: true,
      content: mergeMessageDialogContent(raw, async () => {
        await Promise.resolve(userSubmit());
        get().closeMessageDialog();
      }),
    });
  },
  closeMessageDialog: () => set({ isOpen: false, content: null }),
}));

/**
 * Open dialog; when `onSubmit` succeeds, dialog will `close` automatically. 
 * Errors thrown from `onSubmit` will keep the dialog open.
 */
export const messageDialogService = {
  open: (options: OpenMessageDialogOptions) => {
    useMessageDialogStore.getState().openMessageDialog(options);
  },
  close: () => {
    useMessageDialogStore.getState().closeMessageDialog();
  },
};
