"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, type FieldErrors } from "react-hook-form";

import { Button } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormLayout,
  LoadingForm,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { applyServerError, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import {
  useDeleteRoleJemaat,
  useRoleJemaatDetail,
  useSaveRoleJemaat,
} from "../api";
import {
  EMPTY_ROLE_JEMAAT_FORM,
  ROLE_JEMAAT_LIST_PATH,
  roleJemaatFormSchema,
  serverFieldError,
  toRoleJemaatForm,
  toRoleJemaatPayload,
  type RoleJemaatFormValues,
} from "../model";

import { JabatanSection } from "./jabatan-section";
import { NoFormAccess } from "./no-form-access";
import { PeriodeSection } from "./periode-section";

interface PropTypes {
  id?: string;
}

export const RoleJemaatFormScreen = (props: PropTypes) => {
  const { id } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(id);
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.ROLE_JEMAAT,
  );
  const listReturn = useListReturn(ROLE_JEMAAT_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveRole = useSaveRoleJemaat(id);
  const deleteRole = useDeleteRoleJemaat(id);
  const detail = useRoleJemaatDetail(id);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<RoleJemaatFormValues>({
    resolver: zodResolver(roleJemaatFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    // Fokus bawaan RHF melompati combobox/select (tanpa ref); fokus diurus efek di bawah.
    shouldFocusError: false,
    defaultValues: EMPTY_ROLE_JEMAAT_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const isBusy = isSubmitting || deleteRole.isPending;
  const rootError = form.formState.errors.root?.message;
  const savedJemaat = detail.data
    ? { value: String(detail.data.jemaat.id), label: detail.data.jemaat.name }
    : undefined;

  const onLeave = () => router.replace(listReturn);

  const onInvalid = (errors: FieldErrors<RoleJemaatFormValues>) =>
    setRejectedField(Object.keys(errors).find((key) => key !== "root") ?? null);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen(isEdit ? "update" : "save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    deleteRole.reset();
    setRejectedField(null);

    try {
      const saved = await saveRole.mutateAsync(toRoleJemaatPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(ROLE_JEMAAT_LIST_PATH, String(saved.data.id));
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = async () => {
    form.clearErrors("root");
    setRejectedField(null);

    try {
      const deleted = await deleteRole.mutateAsync();

      toast.add({ title: deleted.message });
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  };

  useEffect(() => {
    if (detail.data) form.reset(toRoleJemaatForm(detail.data));
  }, [detail.data, form]);

  useEffect(() => {
    if (!isDirty || isBusy) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isBusy]);

  // Ditunda sampai fieldset aktif lagi; combobox Base UI baru melepas disabled satu render sesudahnya.
  useEffect(() => {
    if (isBusy || !rejectedField) return;

    const frame = requestAnimationFrame(() => {
      if (rejectedField !== "root") revealField(rejectedField);
      else (deleteRole.isError ? deleteRef : saveRef).current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isBusy, submitCount, rejectedField, deleteRole.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return <NoFormAccess isEdit={isEdit} />;
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          {isEdit && isCanDelete ? (
            <Button
              ref={deleteRef}
              type="button"
              variant="destructive"
              disabled={isBusy || detail.isLoading}
              onClick={() => confirm.onOpen("delete")}
            >
              {deleteRole.isPending ? "Menghapus…" : "Hapus"}
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
            disabled={isBusy || detail.isLoading}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Jabatan" : "Tambah Jabatan"}
          subtitle={detail.data?.jemaat.name}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? <LoadingForm fields={6} /> : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <JabatanSection
          form={form}
          isDisabled={isBusy}
          savedJemaat={savedJemaat}
        />
        <PeriodeSection form={form} isDisabled={isBusy} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title={
              deleteRole.isError
                ? "Jabatan belum terhapus. Coba hapus lagi."
                : "Data belum tersimpan. Coba simpan lagi."
            }
            message={rootError}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="jabatan jemaat"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={() => void onDelete()}
      />
    </FormLayout>
  );
};
