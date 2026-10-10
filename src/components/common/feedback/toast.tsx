"use client";

import { Toast } from "@base-ui/react/toast";
import { X } from "lucide-react";
import { useEffect } from "react";

import { connectToast } from "@/lib/toast-bus";

export const useToast = Toast.useToastManager;

/** Menyambungkan showToast() ke manajer toast; tidak merender apa pun. */
function ToastBridge() {
  const toast = Toast.useToastManager();

  useEffect(() => connectToast((next) => toast.add(next)), [toast]);

  return null;
}

export function ToastHost({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider>
      <ToastBridge />

      {children}

      <Toast.Portal>
        <Toast.Viewport className="fixed inset-x-0 bottom-[calc(var(--bottom-tab-height)+env(safe-area-inset-bottom)+0.75rem)] z-50 flex flex-col gap-2 px-gutter lg:right-6 lg:bottom-6 lg:left-auto lg:w-96 lg:px-0">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className="bg-card ring-hairline data-[type=error]:bg-destructive/10 data-[type=error]:ring-destructive/40 data-[type=warning]:bg-warning-100 data-[type=warning]:ring-warning-400 flex items-start gap-3 rounded-lg p-3 shadow-lg ring-1 transition-[opacity,translate] duration-200 data-ending-style:translate-y-2 data-ending-style:opacity-0 data-limited:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0"
    >
      <Toast.Content className="min-w-0 flex-1">
        <Toast.Title className="text-body font-medium" />
        <Toast.Description className="text-muted-foreground text-caption" />
      </Toast.Content>

      <Toast.Close
        aria-label="Tutup pesan"
        className="hover:bg-accent focus-visible:ring-ring -m-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-control transition-colors outline-none focus-visible:ring-2"
      >
        <X className="size-3.5" aria-hidden />
      </Toast.Close>
    </Toast.Root>
  ));
}
