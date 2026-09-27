"use client";

import { Check, Copy } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/common/control";
import { DescriptionItem, DescriptionList } from "@/components/common/display";
import { ConfirmDialog } from "@/components/common/overlay";
import { useBoolean } from "@/hooks/use-boolean";

import type { UserCredential } from "../types";

interface PropTypes {
  title: string;
  credential: UserCredential | null;
  onDone: () => void;
}

export const CredentialDialog = (props: PropTypes) => {
  const { title, credential, onDone } = props;

  const isCopied = useBoolean();
  const passwordRef = useRef<HTMLSpanElement>(null);

  const onClose = () => {
    isCopied.onFalse();
    onDone();
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(credential?.password ?? "");
      isCopied.onTrue();
    } catch {
      if (passwordRef.current) {
        window.getSelection()?.selectAllChildren(passwordRef.current);
      }
    }
  };

  return (
    <ConfirmDialog
      isOpen={credential !== null}
      onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}
      title={title}
      description="Password ini hanya ditampilkan sekali. Serahkan langsung ke pemiliknya; ia wajib menggantinya saat masuk pertama."
      confirmLabel="Selesai"
      cancelLabel={null}
      isClosedOnConfirm={false}
      onConfirm={onClose}
    >
      {credential ? (
        <DescriptionList>
          <DescriptionItem label="Nama">{credential.name}</DescriptionItem>
          <DescriptionItem label="Username">
            {credential.username}
          </DescriptionItem>
          <DescriptionItem label="Password sementara" isStacked>
            <span className="bg-muted flex items-center justify-between gap-2 rounded-control py-1 pr-1 pl-3">
              <span
                ref={passwordRef}
                className="min-w-0 font-mono text-title break-all select-all"
              >
                {credential.password}
              </span>

              <Button
                type="button"
                variant="outline"
                className="shrink-0 cursor-pointer"
                onClick={() => void onCopy()}
              >
                {isCopied.value ? <Check aria-hidden /> : <Copy aria-hidden />}
                {isCopied.value ? "Tersalin" : "Salin"}
              </Button>
            </span>

            <span aria-live="polite" className="sr-only">
              {isCopied.value ? "Password tersalin" : ""}
            </span>
          </DescriptionItem>
        </DescriptionList>
      ) : null}
    </ConfirmDialog>
  );
};
