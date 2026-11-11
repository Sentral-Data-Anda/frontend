import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  DateField,
  Input,
  SelectField,
  optionsOf,
} from "@/components/common/control";
import { ControlField, FormAlert } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";

import { useKeluargaOptions } from "../api";
import {
  CHILD_STAYS,
  EMPTY_END_MEMBERSHIP,
  END_REASON_LABEL,
  MEMBER_ROLE_LABEL,
  endMembershipSchemaFor,
  householdLabel,
  toEndMembershipPayload,
  type EndMembershipValues,
} from "../model";
import type { EndMembershipPayload, KeluargaMember } from "../types";

const REASON_OPTIONS = optionsOf(END_REASON_LABEL);

const ANSWER_OPTIONS = [
  { value: "true", label: "Ya, tutup keanggotaannya juga" },
  { value: "false", label: "Tidak, dia tetap di keluarga ini" },
];

/** Who is still in the household once this ending is applied as answered. */
const stayingAfter = (
  others: readonly KeluargaMember[],
  partner: KeluargaMember | null,
  isPartnerClosed: boolean,
  placements: EndMembershipValues["childPlacements"],
) =>
  others.filter(
    (row) =>
      !(isPartnerClosed && row.id === partner?.id) &&
      !(
        isPartnerClosed &&
        row.role === "ANAK" &&
        placements.some(
          (placement) =>
            placement.jemaatCode === row.jemaatCode &&
            placement.keluargaCode &&
            placement.keluargaCode !== CHILD_STAYS,
        )
      ),
  );

interface PropTypes {
  member: KeluargaMember | null;
  live: readonly KeluargaMember[];
  isPending: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (payload: EndMembershipPayload) => void;
}

export const EndMembershipDialog = (props: PropTypes) => {
  const { member, live, isPending, errorMessage, onClose, onSubmit } = props;

  const others = live.filter((row) => row.id !== member?.id);
  // The other half of a couple, which a divorce ends too. Read off the seats:
  // SUAMI ↔ ISTRI, regardless of which of them the KK is registered under.
  const partner =
    member?.role === "SUAMI"
      ? (others.find((row) => row.role === "ISTRI") ?? null)
      : member?.role === "ISTRI"
        ? (others.find((row) => row.role === "SUAMI") ?? null)
        : null;
  const children = others.filter((row) => row.role === "ANAK");

  const endsHeadWith = (isPartnerClosed: boolean) =>
    member?.isHead === true || (isPartnerClosed && partner?.isHead === true);

  // Whether a replacement may be OFFERED, not required. Since 2026-11-02 the
  // backend hands the headship on by itself — SUAMI → ISTRI → eldest live
  // ANAK — so the clerk is no longer made to invent a name. Naming one still
  // overrides the chain, because a father may be alive while his son is the
  // registered head. Asked once and used by both the form and the schema: two
  // copies drift, and the copy that drifts leaves a field with no input.
  const canNameSuccessorWith = (
    reason: string,
    isPartnerClosed: boolean,
    stayingCount: number,
  ) => reason !== "" && endsHeadWith(isPartnerClosed) && stayingCount > 0;

  const form = useForm<EndMembershipValues>({
    defaultValues: EMPTY_END_MEMBERSHIP,
    // Built per submission rather than once: what has to be answered depends
    // on who is leaving and on the answers given so far. Who takes over as
    // head is no longer one of them — the backend walks the chain — so this
    // only needs to know about the partner and the children.
    resolver: (values, context, options) =>
      zodResolver(
        endMembershipSchemaFor({
          partnerName: partner?.name ?? null,
          children: children.map((row) => ({
            jemaatCode: row.jemaatCode,
            name: row.name,
          })),
        }),
      )(values, context, options),
  });

  const endReason = useWatch({ control: form.control, name: "endReason" });
  const alsoEndPartner = useWatch({
    control: form.control,
    name: "alsoEndPartner",
  });
  const keluarga = useKeluargaOptions();
  // Households are listed by their head's name, which reads like a person
  // right above the successor list; the "Kel." label tells them apart.
  const familyOptions = keluarga.options.map((option) => ({
    ...option,
    label: householdLabel({ name: option.label, code: option.value }),
  }));

  const isDivorce = endReason === "CERAI_HIDUP";
  const isSplitting = isDivorce && alsoEndPartner === "true";
  const placements = useWatch({
    control: form.control,
    name: "childPlacements",
  });
  const staying = stayingAfter(others, partner, isSplitting, placements);
  const canNameSuccessor = canNameSuccessorWith(
    endReason,
    isSplitting,
    staying.length,
  );
  const successorOptions = staying.map((row) => ({
    value: row.jemaatCode,
    label: `${row.name} — ${MEMBER_ROLE_LABEL[row.role]}`,
  }));

  // Reopening for another member must not carry the previous answers over.
  useEffect(() => {
    if (!member) return;

    form.reset({
      ...EMPTY_END_MEMBERSHIP,
      childPlacements: children.map((row) => ({
        jemaatCode: row.jemaatCode,
        keluargaCode: "",
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  if (!member) return null;

  const onConfirm = form.handleSubmit((values) =>
    onSubmit(toEndMembershipPayload(values)),
  );

  return (
    <ConfirmDialog
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={`Akhiri keanggotaan ${member.name}`}
      description="Keanggotaan tetap tersimpan sebagai riwayat. Hapus hanya untuk baris yang salah catat."
      confirmLabel="Akhiri"
      isDestructive
      isPending={isPending}
      isClosedOnConfirm={false}
      onConfirm={onConfirm}
    >
      <div className="max-h-[60vh] space-y-3 overflow-y-auto">
        <ControlField
          control={form.control}
          name="endedAt"
          label="Tanggal berakhir"
          isRequired
        >
          {(field) => (
            <DateField
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isPending}
              label="Tanggal berakhir"
            />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="endReason"
          label="Alasan berakhir"
          isRequired
        >
          {(field) => (
            <SelectField
              value={field.value}
              onValueChange={field.onChange}
              disabled={isPending}
              options={REASON_OPTIONS}
              placeholder="Pilih alasan"
            />
          )}
        </ControlField>

        {isDivorce && partner ? (
          <ControlField
            control={form.control}
            name="alsoEndPartner"
            label={`Keanggotaan ${partner.name}`}
            isRequired
          >
            {(field) => (
              <SelectField
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPending}
                options={ANSWER_OPTIONS}
                placeholder="Cerai mengakhiri keduanya. Pilih salah satu."
              />
            )}
          </ControlField>
        ) : null}

        {isSplitting && children.length > 0 ? (
          <fieldset className="border-hairline rounded-control space-y-3 border p-3">
            <legend className="text-caption px-1">Pembagian anak</legend>

            {children.map((child, index) => (
              <ControlField
                key={child.id}
                control={form.control}
                name={`childPlacements.${index}.keluargaCode`}
                label={child.name}
                isRequired
              >
                {(field) => (
                  <SelectField
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                    options={[
                      { value: CHILD_STAYS, label: "Tetap di keluarga ini" },
                      ...familyOptions,
                    ]}
                    placeholder="Ikut keluarga yang mana"
                  />
                )}
              </ControlField>
            ))}
          </fieldset>
        ) : null}

        {canNameSuccessor ? (
          <ControlField
            control={form.control}
            name="newHeadJemaatCode"
            label="Kepala keluarga pengganti"
            hint="Kosongkan untuk mengikuti urutan: suami, lalu istri, lalu anak tertua."
          >
            {(field) => (
              <SelectField
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPending}
                options={successorOptions}
                placeholder="Ikuti urutan"
              />
            )}
          </ControlField>
        ) : null}

        <ControlField
          control={form.control}
          name="endNote"
          label="Catatan"
          isOptional
        >
          {(field) => <Input {...field} maxLength={250} />}
        </ControlField>

        {errorMessage ? (
          <FormAlert title="Belum bisa diakhiri." message={errorMessage} />
        ) : null}
      </div>
    </ConfirmDialog>
  );
};
