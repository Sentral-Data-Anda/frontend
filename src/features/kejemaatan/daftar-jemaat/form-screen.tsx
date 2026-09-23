"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";

import { Button } from "@/components/common/button";
import { FormActions, FormLayout } from "@/components/common/form-layout";
import { PageHeader } from "@/components/layout/page-header";
import { MENU, menuHref } from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";

import { useSaveJemaat } from "./api";
import {
  EMPTY_JEMAAT_FORM,
  incompleteFields,
  jemaatFormSchema,
  toJemaatPayload,
  type JemaatFormValues,
} from "./model";
import {
  AddressSection,
  ContactSection,
  IdentitySection,
  MembershipSection,
  SocialSection,
} from "./ui/form-sections";

export const JEMAAT_LIST_PATH = menuHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT);

/**
 * Satu layar untuk dua mode: tambah (`code` kosong) dan ubah.
 *
 * Field, validasi, dan tata letaknya identik; yang berbeda hanya sumber nilai
 * awal, judul, label tombol, dan kata kerja HTTP-nya. Dua berkas untuk itu
 * akan berbeda pelan-pelan tanpa ada yang sengaja membedakannya.
 *
 * `mode: "onTouched"` (form-pattern.md §3.6): galat pertama kali muncul saat
 * field DITINGGALKAN, bukan saat huruf pertama diketik — mengetik "Mar" dari
 * "Maria" tidak boleh langsung berwarna merah. Setelah sebuah field pernah
 * salah, `reValidateMode: "onChange"` memeriksanya tiap ketikan supaya
 * pesannya hilang begitu benar.
 */
export function JemaatFormScreen({ code }: { code?: string }) {
  const router = useRouter();
  const saveJemaat = useSaveJemaat(code);

  const form = useForm<JemaatFormValues>({
    resolver: zodResolver(jemaatFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: EMPTY_JEMAAT_FORM,
  });

  const { isSubmitting } = form.formState;
  const rootError = form.formState.errors.root?.message;
  // `useWatch`, bukan `form.watch()`: yang kedua mengembalikan fungsi baru
  // tiap render, sehingga React Compiler melewatkan seluruh komponen ini.
  const missing = incompleteFields(useWatch({ control: form.control }));

  const onSave = form.handleSubmit(
    async (values) => {
      try {
        await saveJemaat.mutateAsync(toJemaatPayload(values));
        router.replace(JEMAAT_LIST_PATH);
      } catch (error) {
        // Isian TIDAK PERNAH dibuang karena gagal simpan: yang hilang bukan
        // satu klik, melainkan dua puluh field yang baru diketik.
        form.setError("root", {
          message:
            error instanceof FetchError
              ? error.message
              : "Tidak dapat menghubungi server. Periksa koneksi Anda.",
        });
      }
    },
    (errors) => onScrollToFirstError(errors),
  );

  return (
    <FormLayout
      onSubmit={onSave}
      header={
        <PageHeader
          title={code ? "Ubah Jemaat" : "Tambah Jemaat"}
          subtitle={code}
          backHref={JEMAAT_LIST_PATH}
        />
      }
    >
      <IdentitySection form={form} isDisabled={isSubmitting} />
      <MembershipSection form={form} isDisabled={isSubmitting} />
      <ContactSection form={form} isDisabled={isSubmitting} />
      <AddressSection form={form} isDisabled={isSubmitting} />
      <SocialSection form={form} isDisabled={isSubmitting} />

      <div className="space-y-3 px-gutter pt-4">
        {/*
          Penanda data belum lengkap (keputusan user): peringatan, bukan
          penghalang. Jemaatnya tetap boleh disimpan dan dilengkapi nanti —
          menahan seluruh orang karena satu angka yang tidak diketahui justru
          membuat orangnya tidak tercatat sama sekali.
        */}
        {missing.length > 0 ? (
          <p className="text-muted-foreground text-caption">
            Belum lengkap: {missing.join(", ")}. Jemaat tetap bisa disimpan dan
            dilengkapi nanti.
          </p>
        ) : null}

        {rootError ? (
          <p role="alert" className="text-destructive text-body">
            {rootError}
          </p>
        ) : null}
      </div>

      <FormActions>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.replace(JEMAAT_LIST_PATH)}
        >
          Batal
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan…" : "Simpan"}
        </Button>
      </FormActions>
    </FormLayout>
  );
}

/**
 * Fokus ke field galat pertama sudah diurus RHF (`shouldFocusError`), tapi di
 * halaman ±20 field fokus saja bisa mendarat tepat di bawah baris aksi yang
 * menempel — terlihat seperti tidak terjadi apa-apa. Karena itu digulir juga.
 */
function onScrollToFirstError(errors: FieldErrors<JemaatFormValues>) {
  const first = Object.keys(errors).find((key) => key !== "root");

  if (!first) return;

  document
    .getElementById(first)
    ?.scrollIntoView({ block: "center", behavior: "smooth" });
}
