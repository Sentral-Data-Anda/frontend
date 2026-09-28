"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
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
import { useBoolean } from "@/hooks/use-boolean";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { formatTimeRange, formatWeekday } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  useClashCheck,
  useDeleteLoanRoom,
  useLoanRoomDetail,
  useRefreshSlots,
  useSaveLoanBatch,
  useSaveLoanRoom,
} from "../api";
import {
  EMPTY_LOAN_FORM,
  LOAN_LIST_PATH,
  REPEAT_MAX,
  batchRowErrors,
  formatLoanDate,
  loanFormSchema,
  loanStatusOf,
  previewRowsOf,
  repeatDatesOf,
  toBatchRows,
  toLoanBody,
  toLoanForm,
  type LoanFormValues,
} from "../model";

import { isTimeRange } from "./form-options";
import { PurposeSection } from "./purpose-section";
import { PREVIEW_ID, RepeatPreview } from "./repeat-preview";
import { RepeatSection } from "./repeat-section";
import { ScheduleSection } from "./schedule-section";

const RACE_ID = "loan-race";

const NO_DATES: ReadonlySet<string> = new Set();

const NO_ERRORS: ReadonlyMap<string, string> = new Map();

type Keyed<T> = { key: string; value: T };

interface PropTypes {
  code?: string;
}

export const LoanFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.PEMINJAMAN_RUANG,
  );
  const listReturn = useListReturn(LOAN_LIST_PATH);
  const confirm = useFormConfirm();
  const detail = useLoanRoomDetail(isCanUpdate ? code : undefined);
  const saveLoan = useSaveLoanRoom(code);
  const saveBatch = useSaveLoanBatch();
  const deleteLoan = useDeleteLoanRoom(code);
  const onRefreshSlots = useRefreshSlots();
  const rooms = useDdlOptions("room", "id");
  const isRace = useBoolean();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const [unticked, setUnticked] = useState<Keyed<ReadonlySet<string>>>({
    key: "",
    value: NO_DATES,
  });
  const [rowErrors, setRowErrors] = useState<
    Keyed<ReadonlyMap<string, string>>
  >({ key: "", value: NO_ERRORS });

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_LOAN_FORM,
  });

  const [roomId, date, startTime, endTime, repeat, until] = useWatch({
    control: form.control,
    name: ["roomId", "date", "startTime", "endTime", "repeat", "until"],
  });
  const { isDirty, isSubmitting, isSubmitted, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isWeekly = !isEdit && repeat === "WEEKLY";
  const dates = isWeekly ? repeatDatesOf({ repeat, date, until }) : [];
  const isOverMax = dates.length > REPEAT_MAX;
  const isCheckable =
    isWeekly &&
    Boolean(roomId) &&
    isTimeRange(startTime, endTime) &&
    dates.length > 0 &&
    !isOverMax;
  const check = useClashCheck(
    { roomId: Number(roomId), startTime, endTime, dates },
    isCheckable,
  );
  const previewKey = [roomId, startTime, endTime, dates.join()].join("|");
  const previewRows =
    isCheckable && check.data
      ? previewRowsOf(
          dates,
          check.data,
          unticked.key === previewKey ? unticked.value : NO_DATES,
        )
      : null;
  const previewErrors =
    rowErrors.key === previewKey ? rowErrors.value : NO_ERRORS;
  const ticked = previewRows?.filter((row) => row.isTicked).length ?? 0;
  const isPast = detail.data ? loanStatusOf(detail.data) === "DONE" : false;
  const isBusy = isSubmitting || deleteLoan.isPending;
  const isLocked = isBusy || (isEdit && !detail.data);
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const isCheckHeld = isCheckable && !check.isSuccess;
  const roomName =
    rooms.options.find((room) => room.value === roomId)?.label ?? "ruang ini";

  const subtitle = detail.data
    ? `${detail.data.room.name} · ${formatLoanDate(detail.data.date)}`
    : undefined;

  const onLeaveToList = () => router.replace(listReturn);

  const onCancel = () => confirm.onCancel(isDirty, onLeaveToList);

  const onBack = (event: MouseEvent<HTMLAnchorElement>) =>
    confirm.onBack(isDirty)(event);

  const onToggle = useCallback(
    (day: string, isTicked: boolean) => {
      setUnticked((current) => {
        const next = new Set(current.key === previewKey ? current.value : []);

        if (isTicked) next.delete(day);
        else next.add(day);

        return { key: previewKey, value: next };
      });
      setRowErrors((current) => {
        if (!current.value.has(day)) return current;

        const next = new Map(current.value);

        next.delete(day);

        return { ...current, value: next };
      });
    },
    [previewKey],
  );

  const onRecheck = () => {
    isRace.onFalse();
    void check.refetch();
  };

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    if (isWeekly && (!previewRows || ticked === 0)) {
      setRejectedField(PREVIEW_ID);
      return;
    }

    setRejectedField(null);
    confirm.onOpen(isEdit ? "update" : "save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSaveFailed = (error: unknown, values: LoanFormValues) => {
    if (error instanceof FetchError && error.status === 409) {
      void onRefreshSlots(values.roomId, values.date);
    }
    if (
      error instanceof FetchError &&
      error.status === 409 &&
      error.issues.length === 0
    ) {
      form.setError("startTime", { message: error.message });
      setRejectedField("startTime");
      return;
    }

    setRejectedField(applyServerError(error, form.setError));
  };

  const onSaveOne = async (values: LoanFormValues) => {
    try {
      const saved = await saveLoan.mutateAsync(toLoanBody(values));

      toast.add({ title: saved.message });
      saveListFocus(LOAN_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      onSaveFailed(error, values);
    }
  };

  const onSaveMany = async (values: LoanFormValues) => {
    if (!previewRows) return;

    const batch = toBatchRows(values, previewRows);

    try {
      const saved = await saveBatch.mutateAsync(batch.rows);

      toast.add({ title: saved.message });
      saveListFocus(LOAN_LIST_PATH, saved.data.codes[0]);
      router.replace(listReturn);
    } catch (error) {
      const failure = batchRowErrors(error, batch.previewIndexOf, previewRows);
      const firstRow = [...failure.rowErrors.keys()].sort((a, b) => a - b)[0];

      setRowErrors({
        key: previewKey,
        value: new Map(
          [...failure.rowErrors].map(([index, message]) => [
            previewRows[index].date,
            message,
          ]),
        ),
      });
      for (const [field, message] of failure.fieldErrors) {
        form.setError(field, { message });
      }
      if (failure.root) form.setError("root", { message: failure.root });
      if (failure.isRace) {
        isRace.onTrue();
        void onRefreshSlots(values.roomId, values.date);
      }
      setRejectedField(
        firstRow !== undefined
          ? `repeat-row-${firstRow}`
          : failure.fieldErrors.size > 0
            ? FIRST_INVALID
            : failure.isRace
              ? RACE_ID
              : "root",
      );
    }
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    deleteLoan.reset();
    isRace.onFalse();
    setRejectedField(null);

    await (isWeekly ? onSaveMany(values) : onSaveOne(values));
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteLoan.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  const onRetryDetail = () => void detail.refetch();

  useEffect(() => {
    if (detail.data) form.reset(toLoanForm(detail.data));
  }, [detail.data, form]);

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

  useEffect(() => {
    if (deleteLoan.isError) deleteRef.current?.focus();
  }, [deleteLoan.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah peminjaman"
            : "Tidak bisa menambah peminjaman"
        }
        description="Peran Anda hanya bisa melihat data peminjaman ruang."
        backHref={LOAN_LIST_PATH}
        backLabel="Kembali ke Peminjaman Ruang"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun="peminjaman"
        backHref={listReturn}
        backLabel="Kembali ke Peminjaman Ruang"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          {isPast ? (
            <Button type="button" variant="outline" onClick={onLeaveToList}>
              Kembali
            </Button>
          ) : (
            <>
              {isEdit && isCanDelete ? (
                <Button
                  ref={deleteRef}
                  type="button"
                  variant="destructive"
                  disabled={isLocked}
                  onClick={() => confirm.onOpen("delete")}
                >
                  {deleteLoan.isPending ? "Menghapus…" : "Hapus"}
                </Button>
              ) : null}

              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={onCancel}
              >
                Batal
              </Button>

              <Button
                ref={saveRef}
                type="submit"
                disabled={isLocked || isCheckHeld}
              >
                {isSubmitting
                  ? "Menyimpan…"
                  : previewRows
                    ? `Simpan ${ticked} peminjaman`
                    : "Simpan"}
              </Button>
            </>
          )}
        </FormActions>
      }
      header={
        <PageHeader
          title={
            isPast
              ? "Peminjaman Ruang"
              : isEdit
                ? "Ubah Peminjaman"
                : "Tambah Peminjaman"
          }
          subtitle={subtitle}
          backHref={listReturn}
          isBackPersistent
          onBack={onBack}
        />
      }
    >
      <div className="space-y-3 px-gutter pt-4 empty:hidden">
        {isPast ? (
          <FormAlert
            tone="info"
            title="Peminjaman ini sudah lewat."
            message="Peminjaman yang sudah selesai tidak bisa diubah atau dihapus."
          />
        ) : null}

        {detail.error && !isNotFound ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert
              title="Data peminjaman gagal dimuat."
              message="Form belum bisa diisi sampai datanya termuat."
            />
            <Button
              type="button"
              variant="outline"
              disabled={detail.isFetching}
              onClick={onRetryDetail}
            >
              {detail.isFetching ? "Memuat…" : "Coba lagi"}
            </Button>
          </div>
        ) : null}
      </div>

      {isEdit && detail.isLoading ? (
        <LoadingForm fields={7} label="Memuat data peminjaman…" />
      ) : null}

      <div className={isEdit && !detail.data ? "hidden" : undefined}>
        <ScheduleSection
          form={form}
          isDisabled={isBusy}
          isReadOnly={isPast}
          saved={detail.data}
        />

        {isEdit ? null : (
          <RepeatSection form={form} isDisabled={isBusy}>
            <RepeatPreview
              rows={previewRows}
              dateCount={dates.length}
              errors={previewErrors}
              isCheckable={isCheckable}
              isOverMax={isOverMax}
              isError={check.isError}
              isFetching={check.isFetching}
              isNoneTicked={isSubmitted}
              isDisabled={isBusy}
              onRecheck={onRecheck}
              onToggle={onToggle}
            />
          </RepeatSection>
        )}

        <PurposeSection
          form={form}
          isDisabled={isBusy || isPast}
          saved={detail.data}
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {isRace.value ? (
          <div
            id={RACE_ID}
            tabIndex={-1}
            className="flex flex-col items-start gap-2 outline-none"
          >
            <FormAlert
              title="Tidak ada yang tersimpan."
              message="Ada jadwal yang baru saja terisi; periksa ulang bentrok."
            />
            <Button
              type="button"
              variant="outline"
              disabled={check.isFetching || isBusy}
              onClick={onRecheck}
            >
              {check.isFetching ? "Memeriksa…" : "Periksa ulang"}
            </Button>
          </div>
        ) : null}

        {previewErrors.size > 0 ? (
          <FormAlert
            title="Tidak ada yang tersimpan."
            message={`${previewErrors.size} tanggal ditolak. Hapus centangnya atau ubah jamnya, lalu simpan lagi.`}
          />
        ) : null}

        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteLoan.error ? (
          <FormAlert
            title="Peminjaman belum terhapus."
            message={deleteLoan.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="peminjaman"
        descriptions={{
          save: previewRows
            ? `Apakah Anda ingin menyimpan ${ticked} peminjaman ${roomName} tiap ${formatWeekday(date)}, ${formatTimeRange(startTime, endTime)}?`
            : undefined,
          delete:
            "Apakah Anda ingin menghapus peminjaman ini? Jamnya akan bisa dipesan lagi. Peminjaman lain pada minggu berikutnya tidak ikut terhapus.",
        }}
        onSave={() => void onSave()}
        onLeave={onLeaveToList}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
