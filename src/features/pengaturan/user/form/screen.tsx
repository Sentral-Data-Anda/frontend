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
} from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess, useSession } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import {
  useAssignableRoleOptions,
  useDeactivateUser,
  useResetUser,
  useRestoreUser,
  useSaveUser,
  useUserDetail,
} from "../api";
import {
  accountGateOf,
  EMPTY_USER_FORM,
  serverFieldError,
  toUserForm,
  toUserPayload,
  USER_LIST_PATH,
  userCreateSchema,
  userEditSchema,
  type UserFormValues,
} from "../model";
import type { UserCredential } from "../types";

import { AccountSection } from "./account-section";
import { CredentialDialog } from "./credential-dialog";
import { JemaatSection } from "./jemaat-section";
import { NoFormAccess } from "./no-form-access";
import { RoleSection } from "./role-section";

type IssueKind = "create" | "reset" | "restore";

const CREDENTIAL_TITLE: Record<IssueKind, string> = {
  create: "Akun berhasil dibuat",
  reset: "Password berhasil direset",
  restore: "Akun berhasil diaktifkan kembali",
};

const ISSUE_QUESTION: Record<"reset" | "restore", (name: string) => string> = {
  reset: (name) =>
    `Reset password akun ${name}? Semua sesi akun ini akan keluar.`,
  restore: (name) =>
    `Aktifkan kembali akun ${name}? Password sementara baru akan dibuat.`,
};

interface PropTypes {
  code?: string;
}

export const UserFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const session = useSession();
  const isEdit = Boolean(code);
  const access = useMenuAccess(MENU.USER);
  const listReturn = useListReturn(USER_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const [pickIssue, setPickIssue] = useState<"reset" | "restore" | null>(null);
  const [issued, setIssued] = useState<{
    kind: IssueKind;
    credential: UserCredential;
  } | null>(null);
  const saveUser = useSaveUser(code);
  const resetUser = useResetUser(code);
  const restoreUser = useRestoreUser(code);
  const deactivateUser = useDeactivateUser(code);
  const detail = useUserDetail(code);
  const assignable = useAssignableRoleOptions();
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLButtonElement>(null);
  const deactivateRef = useRef<HTMLButtonElement>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? userEditSchema : userCreateSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_USER_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const isAdmin = session.roleUser.isAdmin;
  const user = detail.data;
  const gate = user
    ? accountGateOf(user, {
        ...access,
        code: session.code,
        isAdmin,
        assignable: assignable.options,
      })
    : null;
  const isLoading =
    detail.isLoading || (isEdit && !isAdmin && assignable.isLoading);
  const isRoleEditable = !isEdit || Boolean(gate?.isRoleEditable);
  const isNoAssignable =
    !isEdit && !assignable.isLoading && assignable.options.length === 0;
  const isBusy =
    isSubmitting ||
    resetUser.isPending ||
    restoreUser.isPending ||
    deactivateUser.isPending;
  const rootError = form.formState.errors.root?.message;
  const issuePending =
    pickIssue === "restore" ? restoreUser.isPending : resetUser.isPending;
  const isRoleMissing =
    user !== undefined &&
    !assignable.options.some(
      (option) => option.value === String(user.roleUser.id),
    );
  const roleOptions =
    user && (isRoleMissing || !isRoleEditable)
      ? [
          { value: String(user.roleUser.id), label: user.roleUser.name },
          ...(isRoleEditable ? assignable.options : []),
        ]
      : assignable.options;

  const failedTitle = deactivateUser.isError
    ? "Akun belum dinonaktifkan. Coba lagi."
    : resetUser.isError
      ? "Password belum direset. Coba lagi."
      : restoreUser.isError
        ? "Akun belum diaktifkan kembali. Coba lagi."
        : "Data belum tersimpan. Coba simpan lagi.";

  const roleHint = !gate
    ? undefined
    : gate.isDeactivated
      ? "Aktifkan kembali akun ini dulu untuk mengubah role."
      : !gate.isManageable
        ? "Role akun ini melebihi hak akses Anda; hanya administrator yang dapat mengubahnya."
        : !gate.isRoleEditable
          ? "Peran Anda tidak memegang izin mengubah role akun."
          : undefined;

  const accountNote = gate?.isSelf
    ? "Ini akun Anda. Ganti password lewat menu Akun."
    : gate?.isDeactivated && !isAdmin
      ? "Akun ini nonaktif. Hanya administrator yang dapat mengaktifkannya kembali."
      : undefined;

  const onLeave = () => router.replace(listReturn);

  const onResetFailures = () => {
    form.clearErrors("root");
    setRejectedField(null);
    saveUser.reset();
    resetUser.reset();
    restoreUser.reset();
    deactivateUser.reset();
  };

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen(isEdit ? "update" : "save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (values) => {
    onResetFailures();

    try {
      const saved = await saveUser.mutateAsync(toUserPayload(values));

      if (!isEdit) {
        setIssued({ kind: "create", credential: saved.data });
        return;
      }

      toast.add({ title: saved.message });
      saveListFocus(USER_LIST_PATH, user?.code ?? "");
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onIssue = async () => {
    const kind = pickIssue;
    if (!kind) return;

    onResetFailures();

    try {
      const response = await (
        kind === "restore" ? restoreUser : resetUser
      ).mutateAsync();

      setIssued({ kind, credential: response.data });
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    } finally {
      setPickIssue(null);
    }
  };

  const onIssueDone = () => {
    const focusCode = issued?.credential.code ?? user?.code;

    setIssued(null);
    saveUser.reset();
    resetUser.reset();
    restoreUser.reset();
    if (focusCode) saveListFocus(USER_LIST_PATH, focusCode);
    router.replace(listReturn);
  };

  const onDeactivate = async () => {
    onResetFailures();

    try {
      const deactivated = await deactivateUser.mutateAsync();

      toast.add({ title: deactivated.message });
      saveListFocus(USER_LIST_PATH, user?.code ?? "");
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  };

  useEffect(() => {
    if (detail.data) form.reset(toUserForm(detail.data));
  }, [detail.data, form]);

  useEffect(() => {
    if (!isDirty || isBusy) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isBusy]);

  useEffect(() => {
    if (isBusy || !rejectedField) return;

    if (rejectedField !== "root") revealField(rejectedField);
    else if (deactivateUser.isError) deactivateRef.current?.focus();
    else if (resetUser.isError) resetRef.current?.focus();
    else if (restoreUser.isError) restoreRef.current?.focus();
    else saveRef.current?.focus();
  }, [
    isBusy,
    submitCount,
    rejectedField,
    deactivateUser.isError,
    resetUser.isError,
    restoreUser.isError,
  ]);

  if (!(isEdit ? access.isCanView : access.isCanCreate)) {
    return <NoFormAccess isEdit={isEdit} />;
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="akun"
        backHref={listReturn}
        backLabel="Kembali ke User"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          <div className="flex gap-2 empty:hidden">
            {gate?.isCanDeactivate ? (
              <Button
                ref={deactivateRef}
                type="button"
                variant="destructive"
                disabled={isBusy || isLoading}
                onClick={() => confirm.onOpen("delete")}
              >
                {deactivateUser.isPending ? "Menonaktifkan…" : "Nonaktifkan"}
              </Button>
            ) : null}

            {gate?.isCanReset ? (
              <Button
                ref={resetRef}
                type="button"
                variant="outline"
                disabled={isBusy || isLoading}
                onClick={() => setPickIssue("reset")}
              >
                Reset password
              </Button>
            ) : null}

            {gate?.isCanRestore ? (
              <Button
                ref={restoreRef}
                type="button"
                variant="outline"
                disabled={isBusy || isLoading}
                onClick={() => setPickIssue("restore")}
              >
                Aktifkan kembali
              </Button>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => confirm.onCancel(isDirty, onLeave)}
            >
              {isRoleEditable ? "Batal" : "Kembali"}
            </Button>

            {isRoleEditable ? (
              <Button
                ref={saveRef}
                type="submit"
                disabled={isBusy || isLoading || isNoAssignable}
              >
                {isSubmitting ? "Menyimpan…" : "Simpan"}
              </Button>
            ) : null}
          </div>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Detail Akun" : "Tambah Akun"}
          subtitle={user?.jemaat.name}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {isLoading ? <LoadingForm fields={4} label="Memuat data akun…" /> : null}

      <div className={isLoading ? "hidden" : undefined}>
        {user ? <AccountSection user={user} note={accountNote} /> : null}
        {isEdit ? null : <JemaatSection form={form} isDisabled={isBusy} />}
        <RoleSection
          form={form}
          options={roleOptions}
          isLoading={assignable.isLoading}
          isDisabled={isBusy || !isRoleEditable}
          hint={roleHint}
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {isNoAssignable ? (
          <FormAlert
            title="Tidak ada role yang boleh Anda berikan."
            message="Akun baru hanya bisa diberi role yang seluruh izinnya Anda pegang. Minta administrator membuat akun ini."
          />
        ) : null}

        {rootError ? (
          <FormAlert title={failedTitle} message={rootError} />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="akun"
        descriptions={
          user
            ? {
                delete: `Nonaktifkan akun ${user.jemaat.name}? Pemiliknya tidak bisa masuk lagi dan semua sesinya keluar.`,
              }
            : undefined
        }
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={() => void onDeactivate()}
      />

      <ConfirmDialog
        isOpen={pickIssue !== null}
        onOpenChange={(isOpen) => (isOpen ? undefined : setPickIssue(null))}
        title="Konfirmasi Tindakan"
        description={
          pickIssue && user ? ISSUE_QUESTION[pickIssue](user.jemaat.name) : ""
        }
        confirmLabel="Ya"
        cancelLabel="Tidak"
        isPending={issuePending}
        isClosedOnConfirm={false}
        isFocusReturnedOnConfirm={false}
        onConfirm={() => void onIssue()}
      />

      <CredentialDialog
        title={issued ? CREDENTIAL_TITLE[issued.kind] : ""}
        credential={issued?.credential ?? null}
        onDone={onIssueDone}
      />
    </FormLayout>
  );
};
