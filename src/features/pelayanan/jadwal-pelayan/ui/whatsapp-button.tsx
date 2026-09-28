"use client";

import { MessageCircle } from "lucide-react";
import { useState, type FocusEvent } from "react";

import { Button, Textarea } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import { ConfirmDialog } from "@/components/common/overlay";
import { useBoolean } from "@/hooks/use-boolean";

const LABEL = "Salin untuk WhatsApp";

interface PropTypes {
  getText: () => string;
  isLabelVisible: boolean;
  isDisabled?: boolean;
}

export const WhatsAppButton = (props: PropTypes) => {
  const { getText, isLabelVisible, isDisabled = false } = props;

  const toast = useToast();
  const [text, setText] = useState("");
  const isManualOpen = useBoolean();

  const onCopy = async () => {
    const next = getText();

    try {
      await navigator.clipboard.writeText(next);
      toast.add({ title: "Teks jadwal disalin. Tempel di WhatsApp." });
    } catch {
      setText(next);
      toast.add({
        title: "Tidak bisa menyalin otomatis.",
        description: "Salin teksnya secara manual dari jendela yang terbuka.",
      });
      isManualOpen.onTrue();
    }
  };

  const onSelectAll = (event: FocusEvent<HTMLTextAreaElement>) =>
    event.currentTarget.select();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={isLabelVisible ? "default" : "icon"}
        aria-label={isLabelVisible ? undefined : LABEL}
        className="shrink-0 cursor-pointer gap-1.5 disabled:cursor-not-allowed"
        disabled={isDisabled}
        onClick={() => void onCopy()}
      >
        <MessageCircle aria-hidden />
        {isLabelVisible ? LABEL : null}
      </Button>

      <ConfirmDialog
        isOpen={isManualOpen.value}
        onOpenChange={isManualOpen.setValue}
        title="Salin teks jadwal"
        description="Tekan lama atau pilih semua, salin, lalu tempel di WhatsApp."
        confirmLabel="Tutup"
        cancelLabel={null}
        onConfirm={isManualOpen.onFalse}
      >
        <Textarea
          readOnly
          autoFocus
          rows={10}
          value={text}
          aria-label="Teks jadwal untuk WhatsApp"
          onFocus={onSelectAll}
          className="max-h-[50dvh] font-normal"
        />
      </ConfirmDialog>
    </>
  );
};
