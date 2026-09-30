"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

import { useToast } from "@/components/common/feedback";
import { useFormConfirm } from "@/components/common/form";
import { useListReturn } from "@/hooks/use-list-return";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useSavePersembahanBatch } from "./api";
import {
  PERSEMBAHAN_LIST_PATH,
  emptyPersembahanForm,
  persembahanFormSchema,
  toBatchPayload,
  type PersembahanFormValues,
} from "./model";

/**
 * Satu baris ditolak berarti seluruh batch ditolak, jadi galat dipasang per
 * baris dan seluruh isian klerk tetap di form: yang salah diperbaiki, lalu
 * disimpan lagi.
 */
export function usePersembahanForm() {
  const router = useRouter();
  const toast = useToast();
  const listReturn = useListReturn(PERSEMBAHAN_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const savePersembahan = useSavePersembahanBatch();
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<PersembahanFormValues>({
    resolver: zodResolver(persembahanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyPersembahanForm(),
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;

  const onLeave = () => router.replace(listReturn);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen("save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    setRejectedField(null);

    try {
      const saved = await savePersembahan.mutateAsync(toBatchPayload(values));
      const first = saved.data[0]?.code;

      toast.add({ title: saved.message });
      if (first) saveListFocus(PERSEMBAHAN_LIST_PATH, first);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  }, onInvalid);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  // Ditunda sampai fieldset aktif lagi: kontrol yang disabled menolak fokus.
  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField === "root") saveRef.current?.focus();
    else revealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  return {
    form,
    confirm,
    isDirty,
    isSubmitting,
    listReturn,
    saveRef,
    failure: savePersembahan.error,
    rootError: form.formState.errors.root?.message,
    onConfirm,
    onSave,
    onLeave,
  };
}

export type PersembahanFormState = ReturnType<typeof usePersembahanForm>;

export type PersembahanForm = PersembahanFormState["form"];
