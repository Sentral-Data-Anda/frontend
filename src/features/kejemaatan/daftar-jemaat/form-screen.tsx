"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/common/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  FormActions,
  FormLayout,
  LoadingForm,
} from "@/components/common/form-layout";
import { useToast } from "@/components/common/toast";
import { PageHeader } from "@/components/layout/page-header";
import { useBoolean } from "@/hooks/use-boolean";
import { applyServerError, firstErrorField } from "@/lib/form-error";

import { useJemaatDetail, useSaveJemaat } from "./api";
import {
  afterSavePath,
  EMPTY_JEMAAT_FORM,
  JEMAAT_LIST_PATH,
  incompleteFields,
  jemaatFormSchema,
  serverFieldError,
  toJemaatForm,
  toJemaatPayload,
  type JemaatFormValues,
} from "./model";
import { DuplicateWarning } from "./ui/duplicate-warning";
import {
  AddressSection,
  ContactSection,
  FamilySection,
  IdentitySection,
  MembershipSection,
  SocialSection,
} from "./ui/form-sections";
import { RiwayatSection } from "./ui/riwayat-fields";

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
  const toast = useToast();
  const isEdit = Boolean(code);
  const saveJemaat = useSaveJemaat(code);
  const detail = useJemaatDetail(code);

  const form = useForm<JemaatFormValues>({
    resolver: zodResolver(jemaatFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: EMPTY_JEMAAT_FORM,
  });

  /**
   * Detail dimuat di klien, bukan di server. `form-pattern.md` §3.2 berharap
   * render pertama sudah berisi, tapi layar ini memegang state RHF: nilai
   * awal dari server tetap harus melewati `reset` di klien, jadi prefetch-nya
   * hanya memindahkan satu permintaan tanpa menghapus kerangka memuat.
   * Ditulis sebagai penyimpangan sadar, bukan kelalaian.
   *
   * `reset` bergantung pada `detail.data` yang identitasnya stabil selama
   * query tidak mengambil ulang — jadi isian user tidak pernah ditimpa di
   * tengah pengetikan.
   */
  useEffect(() => {
    if (detail.data) form.reset(toJemaatForm(detail.data));
  }, [detail.data, form]);

  const { isDirty, isSubmitting } = form.formState;
  const isConfirmOpen = useBoolean();

  /**
   * Menutup tab atau me-refresh dengan isian kotor meminta konfirmasi
   * peramban. Ini satu-satunya jalan keluar yang bisa dicegat di luar
   * aplikasi; tombol BACK peramban tidak bisa, karena App Router tidak punya
   * cara resmi membatalkan navigasi yang sudah jalan. Batasan itu diterima —
   * yang dijaga adalah jalan keluar yang kita sediakan sendiri.
   *
   * Tidak dipasang saat form bersih: dialog "yakin mau keluar?" pada halaman
   * yang belum disentuh adalah gangguan, dan peramban modern mengabaikannya.
   */
  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  /** Keluar lewat Batal atau tombol kembali: tanya dulu bila ada yang hilang. */
  const onLeave = () => {
    if (isDirty) isConfirmOpen.onTrue();
    else router.replace(JEMAAT_LIST_PATH);
  };
  const rootError = form.formState.errors.root?.message;
  // `useWatch`, bukan `form.watch()`: yang kedua mengembalikan fungsi baru
  // tiap render, sehingga React Compiler melewatkan seluruh komponen ini.
  const watched = useWatch({ control: form.control });
  const missing = incompleteFields(watched);

  const onSave = form.handleSubmit(
    async (values) => {
      // Galat tingkat form dari percobaan SEBELUMNYA tidak dihapus resolver
      // (ia hanya mengurus field), jadi tanpa baris ini "Kesalahan server."
      // tetap terbaca di bawah tombol saat percobaan kedua berhasil.
      form.clearErrors("root");

      try {
        const saved = await saveJemaat.mutateAsync(
          toJemaatPayload(values, isEdit),
        );

        // Pesan sukses datang dari server apa adanya ("Berhasil Membuat Data
        // Jemaat"): satu kalimat, satu sumber, dan tidak ada dua versi yang
        // harus dijaga sejalan.
        toast.add({ title: saved.message });
        router.replace(afterSavePath(saved.data.code));
      } catch (error) {
        // Isian TIDAK PERNAH dibuang karena gagal simpan: yang hilang bukan
        // satu klik, melainkan dua puluh field yang baru diketik.
        applyServerError(error, form.setError, serverFieldError);
        onScrollTo(firstErrorField(error));
      }
    },
    (errors) => onScrollTo(Object.keys(errors).find((key) => key !== "root")),
  );

  return (
    <FormLayout
      onSubmit={onSave}
      header={
        <PageHeader
          title={isEdit ? "Ubah Jemaat" : "Tambah Jemaat"}
          subtitle={detail.data?.name ?? code}
          backHref={JEMAAT_LIST_PATH}
          onBack={(event) => {
            if (!isDirty) return;

            event.preventDefault();
            isConfirmOpen.onTrue();
          }}
        />
      }
    >
      {detail.isLoading ? <LoadingForm fields={8} /> : null}

      {/*
        Kerangka memuat MENGGANTIKAN isian, bukan menutupinya: form yang
        terisi setengah lalu di-`reset` oleh detail yang baru datang akan
        membuang apa yang sudah diketik.
      */}
      <div className={detail.isLoading ? "hidden" : undefined}>
        <IdentitySection form={form} isDisabled={isSubmitting} />
        <MembershipSection form={form} isDisabled={isSubmitting} />
        <ContactSection form={form} isDisabled={isSubmitting} />
        <AddressSection form={form} isDisabled={isSubmitting} />
        <FamilySection form={form} isDisabled={isSubmitting} />
        <SocialSection form={form} isDisabled={isSubmitting} />
        <RiwayatSection form={form} isDisabled={isSubmitting} isEdit={isEdit} />
      </div>

      <div className="space-y-3 px-gutter pt-4">
        <DuplicateWarning
          name={watched.name ?? ""}
          birthDate={watched.birthDate ?? ""}
          ownCode={code}
        />

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
          onClick={onLeave}
        >
          Batal
        </Button>

        <Button type="submit" disabled={isSubmitting || detail.isLoading}>
          {isSubmitting ? "Menyimpan…" : "Simpan"}
        </Button>
      </FormActions>

      <ConfirmDialog
        isOpen={isConfirmOpen.value}
        onOpenChange={isConfirmOpen.setValue}
        title="Buang perubahan?"
        description="Isian yang belum disimpan akan hilang."
        confirmLabel="Buang"
        cancelLabel="Lanjut mengisi"
        isDestructive
        onConfirm={() => router.replace(JEMAAT_LIST_PATH)}
      />
    </FormLayout>
  );
}

/**
 * Fokus ke field galat pertama sudah diurus RHF (`shouldFocusError`), tapi di
 * halaman ±20 field fokus saja bisa mendarat tepat di bawah baris aksi yang
 * menempel — terlihat seperti tidak terjadi apa-apa. Karena itu digulir juga.
 *
 * Dipakai untuk dua sumber galat: hasil validasi zod di sini, dan `issues[]`
 * yang datang dari server sesudah submit.
 */
function onScrollTo(field: string | null | undefined) {
  if (!field) return;

  document
    .getElementById(field)
    ?.scrollIntoView({ block: "center", behavior: "smooth" });
}
