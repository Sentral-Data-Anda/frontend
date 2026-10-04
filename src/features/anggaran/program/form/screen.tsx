"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useBudgetSetting, useProgramDetail, useSaveProgram } from "../api";
import { CeilingPanel } from "../detail";
import {
  NO_VIEW,
  PROGRAM_LIST_PATH,
  YEAR_UNREADABLE_MESSAGE,
  YEAR_UNREADABLE_TITLE,
  emptyProgramForm,
  programDetailHref,
  programFormSchema,
  programStateOf,
  toProgramForm,
  toProgramPayload,
  yearSelectOptions,
  type ProgramFormValues,
} from "../model";

import { ItemSection } from "./item-section";
import { ProposalSection } from "./proposal-section";

interface PropTypes {
  publicId?: string;
}

export const ProgramFormScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(publicId);
  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(MENU.PROGRAM);
  const listReturn = useListReturn(PROGRAM_LIST_PATH);
  const leaveHref = publicId ? programDetailHref(publicId) : listReturn;
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const setting = useBudgetSetting();
  const detail = useProgramDetail(isCanUpdate ? publicId : undefined);
  const saveProgram = useSaveProgram(publicId);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const yearOptions = yearSelectOptions(setting.data?.budgetYears ?? []);
  const defaultYear = setting.data ? String(setting.data.budgetYear.year) : "";

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyProgramForm(""),
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const program = detail.data;
  const isLocked = program ? programStateOf(program) !== "DRAFT" : false;
  const pickBapel = useWatch({ control: form.control, name: "bapelId" });
  const pickYear = useWatch({ control: form.control, name: "year" });
  const isSameTarget =
    program !== undefined &&
    pickBapel === String(program.bapelId) &&
    pickYear === String(program.year);

  const onLeave = () => router.replace(leaveHref);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen(isEdit ? "update" : "save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (next) => {
    form.clearErrors("root");
    setRejectedField(null);

    try {
      const saved = await saveProgram.mutateAsync(toProgramPayload(next));

      toast.add({ title: saved.message });
      saveListFocus(PROGRAM_LIST_PATH, saved.data.publicId);
      router.replace(programDetailHref(saved.data.publicId));
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  }, onInvalid);

  useEffect(() => {
    if (detail.data) {
      form.reset(toProgramForm(detail.data), { keepDirtyValues: true });
    }
  }, [detail.data, form]);

  useEffect(() => {
    if (isEdit || !defaultYear) return;

    form.setValue("year", defaultYear);
  }, [isEdit, defaultYear, form]);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField === "root") saveRef.current?.focus();
    else revealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit ? "Tidak bisa mengubah program" : "Tidak bisa menambah program"
        }
        description={
          isCanView ? "Peran Anda hanya bisa melihat data program." : NO_VIEW
        }
        backHref={leaveHref}
        backLabel="Kembali ke Program"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="program"
        backHref={listReturn}
        backLabel="Kembali ke Program"
      />
    );
  }

  if (isLocked) {
    return (
      <NoFormAccess
        title="Usulan ini tidak bisa diubah"
        description="Hanya Draf tanpa permintaan persetujuan terbuka yang bisa disunting. Tarik pengajuannya lebih dulu."
        backHref={leaveHref}
        backLabel="Kembali ke usulan"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => confirm.onCancel(isDirty, onLeave)}
          >
            Batal
          </Button>

          <Button
            ref={saveRef}
            type="submit"
            disabled={isSubmitting || detail.isLoading}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Program" : "Tambah Program"}
          subtitle={program?.budgetYear.label ?? undefined}
          backHref={leaveHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={5} label="Memuat data program…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        {!setting.isLoading && yearOptions.length === 0 ? (
          <div className="px-gutter pt-4">
            <FormAlert
              tone="warning"
              title={YEAR_UNREADABLE_TITLE}
              message={YEAR_UNREADABLE_MESSAGE}
            />
          </div>
        ) : null}

        {program && isSameTarget ? (
          <div className="px-gutter pt-4">
            <CeilingPanel
              ceiling={program.ceiling}
              bapelId={program.bapelId}
              yearLabel={program.budgetYear.label}
              proposedAmount={program.proposedAmount}
            />
          </div>
        ) : null}

        <ProposalSection
          form={form}
          yearOptions={yearOptions}
          isDisabled={isSubmitting}
        />

        <ItemSection form={form} isDisabled={isSubmitting} />
      </div>

      <div className="space-y-2 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="program"
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
