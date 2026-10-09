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
  useFormConfirm,
  NoFormAccess,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess, useSession } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import {
  useDeleteRoleUser,
  useMenuOptions,
  useRoleUserDetail,
  useSaveRoleUser,
} from "../api";
import {
  EMPTY_ROLE_USER_FORM,
  ROLE_USER_LIST_PATH,
  isBeyondActor,
  roleUserFormSchema,
  serverFieldError,
  toAccessGroups,
  toRoleSaveError,
  toRoleUserForm,
  toRoleUserPayload,
  type RoleUserFormValues,
} from "../model";

import { AccessSection } from "./access-section";
import { RoleSection } from "./role-section";

interface PropTypes {
  id?: string;
}

export const RoleUserFormScreen = (props: PropTypes) => {
  const { id } = props;

  const router = useRouter();
  const toast = useToast();
  const session = useSession();
  const isEdit = Boolean(id);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.USER_ROLE,
  );
  const listReturn = useListReturn(ROLE_USER_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveRole = useSaveRoleUser(id);
  const deleteRole = useDeleteRoleUser(id);
  const detail = useRoleUserDetail(id);
  const menuOptions = useMenuOptions();
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const form = useForm<RoleUserFormValues>({
    resolver: zodResolver(roleUserFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_ROLE_USER_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteRole.isPending;
  const isLoading = detail.isLoading || menuOptions.isLoading;
  const held = session.roleUser.isAdmin ? null : session.menu;
  const isReadOnly = detail.data ? isBeyondActor(detail.data, held) : false;
  const isOwnRole = detail.data?.name === session.roleUser.name;
  const groups = menuOptions.data
    ? toAccessGroups(menuOptions.data)
    : undefined;

  const onLeave = () => router.replace(listReturn);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen(isEdit ? "update" : "save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReadOnly) void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    deleteRole.reset();
    setRejectedField(null);

    try {
      const saved = await saveRole.mutateAsync(toRoleUserPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(ROLE_USER_LIST_PATH, String(saved.data.id));
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(
          toRoleSaveError(error),
          form.setError,
          serverFieldError,
        ),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteRole.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  useEffect(() => {
    if (detail.data) form.reset(toRoleUserForm(detail.data));
  }, [detail.data, form]);

  useEffect(() => {
    if (!isDirty || isBusy) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isBusy]);

  // Ditunda sampai fieldset aktif lagi: kontrol yang disabled menolak fokus.
  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField !== "root") return revealField(rejectedField);

    saveRef.current?.focus();
    alertRef.current?.scrollIntoView({ block: "center" });
  }, [isSubmitting, submitCount, rejectedField]);

  useEffect(() => {
    if (!deleteRole.isError) return;

    deleteRef.current?.focus();
    alertRef.current?.scrollIntoView({ block: "center" });
  }, [deleteRole.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={isEdit ? "Tidak bisa mengubah role" : "Tidak bisa menambah role"}
        description={"Peran Anda hanya bisa melihat data role user."}
        backHref={ROLE_USER_LIST_PATH}
        backLabel="Kembali ke Role User"
        isCanView={isCanView}
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="role"
        backHref={listReturn}
        backLabel="Kembali ke Role User"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          {isEdit && isCanDelete && !isReadOnly ? (
            <Button
              ref={deleteRef}
              type="button"
              variant="destructive"
              disabled={isBusy || isLoading}
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

          {isReadOnly ? null : (
            <Button ref={saveRef} type="submit" disabled={isBusy || isLoading}>
              {isSubmitting ? "Menyimpan…" : "Simpan"}
            </Button>
          )}
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Role" : "Tambah Role"}
          subtitle={detail.data?.name}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {isLoading ? <LoadingForm fields={4} label="Memuat data role…" /> : null}

      <div className={isLoading ? "hidden" : undefined}>
        <div className="space-y-3 px-gutter pt-5 empty:hidden">
          {isReadOnly ? (
            <FormAlert
              tone="info"
              title="Hanya dapat dilihat"
              message="Role ini memuat izin yang tidak Anda miliki; hanya administrator yang dapat mengubahnya."
            />
          ) : null}

          {isOwnRole ? (
            <FormAlert
              tone="info"
              title="Role Anda sendiri"
              message="Anda memakai role ini. Perubahan izin berlaku untuk Anda setelah sesi diperbarui atau masuk ulang."
            />
          ) : null}
        </div>

        <RoleSection
          form={form}
          isDisabled={isBusy || isReadOnly}
          isAdminLocked={!session.roleUser.isAdmin}
        />

        {isLoading ? null : (
          <AccessSection
            form={form}
            groups={groups}
            held={held}
            optionsError={menuOptions.error}
            isDisabled={isBusy || isReadOnly}
            onRetryOptions={() => void menuOptions.refetch()}
          />
        )}
      </div>

      <div ref={alertRef} className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteRole.error ? (
          <FormAlert
            title="Role belum terhapus."
            message={deleteRole.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="role"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
