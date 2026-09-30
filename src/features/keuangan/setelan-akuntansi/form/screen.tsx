"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormLayout,
  FormNotFound,
  LoadingForm,
  NoFormAccess,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useSaveSetting, useSettingList } from "../api";
import {
  EMPTY_SETTING_FORM,
  NO_VIEW,
  SETELAN_AKUNTANSI_LIST_PATH,
  clearSettingText,
  serverFieldError,
  settingFormSchema,
  toSettingForm,
  toSettingPayload,
  type SettingFormValues,
} from "../model";

import { SettingSection } from "./setting-section";

interface PropTypes {
  settingKey: string;
}

export const SettingFormScreen = (props: PropTypes) => {
  const { settingKey } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView, isCanUpdate } = useMenuAccess(MENU.SETELAN_AKUNTANSI);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const settingList = useSettingList();
  const saveSetting = useSaveSetting(settingKey);
  const clearSetting = useSaveSetting(settingKey);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);

  const form = useForm<SettingFormValues>({
    resolver: zodResolver(settingFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_SETTING_FORM,
  });

  const setting = settingList.settings.find((row) => row.key === settingKey);
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || clearSetting.isPending;
  const isClearable = Boolean(setting?.account);

  const onLeave = () => router.replace(SETELAN_AKUNTANSI_LIST_PATH);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen("update");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onDone = (message: string) => {
    toast.add({ title: message });
    saveListFocus(SETELAN_AKUNTANSI_LIST_PATH, settingKey);
    router.replace(SETELAN_AKUNTANSI_LIST_PATH);
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    clearSetting.reset();
    setRejectedField(null);

    try {
      const saved = await saveSetting.mutateAsync(toSettingPayload(values));

      onDone(saved.message);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onClear = () => {
    form.clearErrors("root");
    clearSetting.mutate(
      { accountId: null },
      { onSuccess: (cleared) => onDone(cleared.message) },
    );
  };

  useEffect(() => {
    if (!setting) return;

    form.reset(toSettingForm(setting), { keepDirtyValues: true });
  }, [setting, form]);

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

  useEffect(() => {
    if (clearSetting.isError) clearRef.current?.focus();
  }, [clearSetting.isError]);

  if (!isCanUpdate) {
    return (
      <NoFormAccess
        title="Tidak bisa mengubah setelan akuntansi"
        description={
          isCanView
            ? "Peran Anda hanya bisa melihat setelan akuntansi."
            : NO_VIEW
        }
        backHref={SETELAN_AKUNTANSI_LIST_PATH}
        backLabel="Kembali ke Setelan Akuntansi"
      />
    );
  }

  if (!settingList.isLoading && !settingList.error && !setting) {
    return (
      <FormNotFound
        noun="setelan"
        backHref={SETELAN_AKUNTANSI_LIST_PATH}
        backLabel="Kembali ke Setelan Akuntansi"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          {isClearable ? (
            <Button
              ref={clearRef}
              type="button"
              variant="destructive"
              disabled={isBusy}
              onClick={() => confirm.onOpen("delete")}
            >
              {clearSetting.isPending ? "Mengosongkan…" : "Kosongkan setelan"}
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => confirm.onCancel(isDirty, onLeave)}
          >
            Batal
          </Button>

          <Button
            ref={saveRef}
            type="submit"
            disabled={isBusy || settingList.isLoading}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={setting?.label ?? "Setelan Akuntansi"}
          backHref={SETELAN_AKUNTANSI_LIST_PATH}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {settingList.isLoading ? (
        <LoadingForm fields={1} label="Memuat setelan…" />
      ) : null}

      {setting ? (
        <SettingSection form={form} setting={setting} isDisabled={isBusy} />
      ) : null}

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {settingList.error ? (
          <FormAlert
            title="Setelan tidak bisa dimuat."
            message={settingList.error.message}
          />
        ) : null}

        {rootError ? (
          <FormAlert
            title="Setelan belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {clearSetting.error ? (
          <FormAlert
            title="Setelan belum dikosongkan."
            message={clearSetting.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="setelan"
        descriptions={{ delete: clearSettingText(setting?.label ?? "ini") }}
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onClear}
      />
    </FormLayout>
  );
};
