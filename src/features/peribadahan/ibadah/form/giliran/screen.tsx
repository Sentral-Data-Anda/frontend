"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
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
import { FIRST_INVALID, revealField } from "@/lib/form-error";

import { hostSuggestionQuery, keluargaAddressQuery } from "../../api";
import { IBADAH_LIST_PATH } from "../../model";
import type { KeluargaAddress } from "../../types";

import {
  rangeQuery,
  toDateSet,
  useIbadahInRange,
  useLatestIbadah,
  useSaveBatch,
} from "./api";
import {
  EMPTY_SETTINGS,
  assignHosts,
  batchRowErrors,
  defaultsFromLatest,
  giliranSettingsSchema,
  previewWarnings,
  rotationDates,
  rowProblems,
  toBatchRows,
  type GiliranSettings,
  type PreviewRow,
  type RowError,
} from "./model";
import { PreviewSection } from "./preview-section";
import { SettingsSection } from "./settings-section";

const DEFAULTED = ["startTime", "endTime", "startDate"] as const;

const ALERT_ID = "giliran-alert";

const NO_DATES: ReadonlySet<string> = new Set();

type Alert = { title: string; message: string };

export const GiliranScreen = () => {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isCanCreate } = useMenuAccess(MENU.IBADAH);
  const listReturn = useListReturn(IBADAH_LIST_PATH);
  const confirm = useFormConfirm();
  const types = useDdlOptions("type-ibadah", "id");
  const zones = useDdlOptions("zone-church", "id");
  const saveBatch = useSaveBatch();
  const isBuilding = useBoolean();
  const isEdited = useBoolean();
  const isRace = useBoolean();
  const { onTrue: onEdited } = isEdited;
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [rowErrors, setRowErrors] = useState<ReadonlyMap<number, RowError>>(
    new Map(),
  );
  const [alert, setAlert] = useState<Alert | null>(null);
  const [emptyKey, setEmptyKey] = useState<string | null>(null);
  const [pickLeave, setPickLeave] = useState<"list" | "settings">("list");
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const form = useForm<GiliranSettings>({
    resolver: zodResolver(giliranSettingsSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_SETTINGS,
  });

  const [typeId, zoneId] = useWatch({
    control: form.control,
    name: ["typeIbadahId", "zoneChurchId"],
  });
  const latest = useLatestIbadah(typeId, zoneId);
  const dates =
    rows
      ?.map((row) => row.date)
      .filter(Boolean)
      .sort() ?? [];
  const range = useIbadahInRange(
    typeId,
    zoneId,
    dates[0] ?? "",
    dates.at(-1) ?? "",
  );
  const { isSubmitting } = form.formState;
  const isSaving = isSubmitting && rows !== null;
  const isDirty = form.formState.isDirty || rows !== null;
  const warnings = rows ? previewWarnings(rows, range.data ?? NO_DATES) : [];
  const ticked = rows?.filter((row) => row.isTicked).length ?? 0;
  const typeName = types.options.find((type) => type.value === typeId)?.label;
  const zoneName = zones.options.find((zone) => zone.value === zoneId)?.label;
  const filteredList = `${IBADAH_LIST_PATH}?tipe=${typeId}&wilayah=${zoneId}`;

  const addressesOf = (list: readonly PreviewRow[]) =>
    Object.fromEntries(
      list.flatMap((row) => {
        const found = row.hostId
          ? queryClient.getQueryData<KeluargaAddress>(
              keluargaAddressQuery(row.hostId).queryKey,
            )
          : undefined;

        return found ? [[row.hostId, found.address]] : [];
      }),
    );

  const onReject = (field: string) => {
    setRejectedField(field);
    setAttempt((count) => count + 1);
  };

  const onBuildRows = async (settings: GiliranSettings) => {
    const planned = rotationDates(
      settings.startDate,
      settings.pattern,
      Number(settings.count),
    );

    setAlert(null);
    isBuilding.onTrue();
    try {
      const [suggestions, existing] = await Promise.all([
        queryClient.fetchQuery(
          hostSuggestionQuery(settings.typeIbadahId, settings.zoneChurchId),
        ),
        queryClient.fetchQuery(
          rangeQuery(
            settings.typeIbadahId,
            settings.zoneChurchId,
            planned[0],
            planned[planned.length - 1],
          ),
        ),
      ]);
      const existingDates = toDateSet(existing);

      if (suggestions.data.length === 0) {
        setEmptyKey(`${settings.typeIbadahId}:${settings.zoneChurchId}`);
        return;
      }

      setEmptyKey(null);
      setRowErrors(new Map());
      isEdited.onFalse();
      isRace.onFalse();
      setRows(
        assignHosts(
          planned,
          planned.map((date) => !existingDates.has(date)),
          suggestions.data.map((host) => String(host.id)),
        ),
      );
    } catch (error) {
      setAlert({
        title: "Pratinjau belum bisa disusun.",
        message:
          error instanceof FetchError
            ? error.message
            : "Tidak dapat menghubungi server. Periksa koneksi Anda.",
      });
      onReject(ALERT_ID);
    } finally {
      isBuilding.onFalse();
    }
  };

  const onBuild = () =>
    void form.handleSubmit(
      (settings) => void onBuildRows(settings),
      () => onReject(FIRST_INVALID),
    )();

  const onDiscardPreview = () => {
    setRows(null);
    setRowErrors(new Map());
    setAlert(null);
    isEdited.onFalse();
    isRace.onFalse();
  };

  const onEditSettings = () => {
    setPickLeave("settings");
    confirm.onCancel(isEdited.value, onDiscardPreview);
  };

  const onLeaveToList = () => router.replace(listReturn);

  const onLeave = () =>
    pickLeave === "settings" ? onDiscardPreview() : onLeaveToList();

  const onCancel = () => {
    setPickLeave("list");
    confirm.onCancel(isDirty, onLeaveToList);
  };

  const onBack = (event: MouseEvent<HTMLAnchorElement>) => {
    setPickLeave("list");
    confirm.onBack(isDirty)(event);
  };

  const onChangeRow = useCallback(
    (index: number, patch: Partial<PreviewRow>) => {
      setRows((current) =>
        current
          ? current.map((row, at) =>
              at === index ? { ...row, ...patch } : row,
            )
          : current,
      );
      setRowErrors((current) => {
        if (!current.has(index)) return current;

        const next = new Map(current);

        next.delete(index);

        return next;
      });
      onEdited();
    },
    [onEdited],
  );

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rows) {
      onBuild();
      return;
    }

    const problems = rowProblems(rows, warnings, addressesOf(rows));

    setRowErrors(problems);
    isRace.onFalse();
    if (problems.size > 0) {
      setAlert({
        title: `${problems.size} baris perlu diperbaiki.`,
        message: "Periksa baris yang bertanda merah, lalu simpan lagi.",
      });
      onReject(FIRST_INVALID);
      return;
    }

    setAlert(null);
    confirm.onOpen("save");
  };

  const onSave = form.handleSubmit(async (settings) => {
    if (!rows) return;

    const { body, previewIndexOf } = toBatchRows(
      settings,
      rows,
      addressesOf(rows),
    );

    setAlert(null);
    isRace.onFalse();
    try {
      const saved = await saveBatch.mutateAsync(body);

      toast.add({ title: saved.message });
      router.replace(filteredList);
    } catch (error) {
      const failure = batchRowErrors(
        error,
        previewIndexOf,
        rows,
        typeName ?? "Ibadah ini",
      );

      setRowErrors(failure.rowErrors);
      if (failure.isRace) isRace.onTrue();
      if (failure.rowErrors.size > 0) {
        setAlert({
          title: "Tidak ada yang tersimpan.",
          message: `${failure.rowErrors.size} baris perlu diperbaiki.`,
        });
      } else if (failure.root) {
        setAlert({ title: "Tidak ada yang tersimpan.", message: failure.root });
      }
      onReject(failure.rowErrors.size > 0 ? FIRST_INVALID : ALERT_ID);
    }
  });

  const onRefreshExisting = async () => {
    await range.refetch();
    isRace.onFalse();
  };

  useEffect(() => {
    if (latest.data === undefined || rows) return;

    const defaults = defaultsFromLatest(latest.data);
    const touched = form.formState.dirtyFields;

    for (const key of DEFAULTED) {
      if (!touched[key]) form.setValue(key, defaults[key]);
    }
  }, [latest.data, rows, form]);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    revealField(rejectedField);
  }, [isSubmitting, rejectedField, attempt]);

  if (!isCanCreate) {
    return (
      <NoFormAccess
        title="Tidak bisa menyusun jadwal giliran"
        description="Peran Anda tidak bisa menambah ibadah."
        backHref={IBADAH_LIST_PATH}
        backLabel="Kembali ke Ibadah"
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
            disabled={isSaving}
            onClick={onCancel}
          >
            Batal
          </Button>

          <Button
            type="submit"
            disabled={!rows || ticked === 0 || isSaving || isBuilding.value}
          >
            {isSaving
              ? "Menyimpan…"
              : rows
                ? `Simpan ${ticked} ibadah`
                : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title="Jadwal giliran tuan rumah"
          subtitle="Ibadah di rumah jemaat, bergilir per wilayah"
          backHref={listReturn}
          isBackPersistent
          onBack={onBack}
        />
      }
    >
      <SettingsSection
        form={form}
        isLocked={rows !== null}
        isDisabled={isSaving}
        isBuilding={isBuilding.value}
        onBuild={onBuild}
        onEdit={onEditSettings}
      />

      <PreviewSection
        rows={rows}
        warnings={warnings}
        errors={rowErrors}
        typeIbadahId={typeId}
        zoneChurchId={zoneId}
        isEmpty={!rows && emptyKey === `${typeId}:${zoneId}`}
        isDisabled={isSaving}
        onChange={onChangeRow}
      />

      <div
        id={ALERT_ID}
        tabIndex={-1}
        className="space-y-3 px-gutter pb-4 outline-none empty:hidden"
      >
        {isRace.value ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert
              title="Tidak ada yang tersimpan."
              message="Ada ibadah yang baru saja tercatat oleh orang lain; buat ulang pratinjau."
            />
            <Button
              type="button"
              variant="outline"
              disabled={range.isFetching || isSaving}
              onClick={() => void onRefreshExisting()}
              isLoading={range.isFetching}
            >
              {range.isFetching ? "Memuat…" : "Buat ulang pratinjau"}
            </Button>
          </div>
        ) : null}

        {alert ? (
          <FormAlert title={alert.title} message={alert.message} />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="ibadah"
        descriptions={{
          save: `Simpan ${ticked} ibadah ${typeName ?? ""} di ${zoneName ?? "wilayah ini"}? Semua tersimpan sekaligus; tuan rumah dan alamat bisa diubah per ibadah sesudahnya.`,
        }}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
