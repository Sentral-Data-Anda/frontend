"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/common/control/button";
import { buttonVariants } from "@/components/common/control/button";
import { useToast } from "@/components/common/feedback/toast";
import {
  FormActions,
  FormLayout,
  LoadingForm,
} from "@/components/common/form/form-layout";
import { ConfirmDialog } from "@/components/common/overlay/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth/use-menu-access";
import { useBoolean } from "@/hooks/use-boolean";
import { useListReturn } from "@/hooks/use-list-return";
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
 * `mode: "onSubmit"` (form-pattern.md §3.6, revisi user 2026-09-23): galat
 * pertama kali muncul saat SIMPAN ditekan, bukan saat field ditinggalkan.
 * Sesudah itu `reValidateMode: "onChange"` memeriksa ulang tiap ketikan,
 * sehingga pesan sebuah field hilang begitu isinya benar.
 *
 * Kenapa bukan saat blur lagi: galat yang muncul saat blur menyisip dan
 * menggeser kontrol di bawahnya tepat saat user menekannya — blur terjadi
 * pada `mousedown` kontrol berikutnya, galatnya muncul, kontrolnya bergeser,
 * dan `mouseup` jatuh di tempat lain sehingga klik tertelan. Dengan validasi
 * saat submit, klik sudah selesai saat galat muncul, dan tidak perlu ada
 * slot kosong yang dipesan di bawah setiap field.
 */
export function JemaatFormScreen({ code }: { code?: string }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.DAFTAR_JEMAAT);

  /**
   * SEMUA jalan keluar dari form kembali ke daftar yang SAMA seperti yang
   * ditinggalkan petugas — bukan hanya jalur simpan. Batal dan "Buang" yang
   * memakai path polos membuang pencarian, filter status, dan halaman yang
   * baru saja disusun, dan itu terasa persis seperti kehilangan isian.
   */
  const listReturn = useListReturn(JEMAAT_LIST_PATH);

  /**
   * Field yang ditolak SERVER, ditunda sampai form terbuka kembali.
   *
   * Tidak bisa difokuskan langsung di `catch`: di titik itu `isSubmitting`
   * masih benar, seluruh fieldset masih `disabled`, dan kontrol yang disabled
   * MENOLAK fokus — terukur, fokusnya mendarat di `<body>`. Jadi field-nya
   * dicatat dulu, lalu dibuka oleh efek di bawah begitu form hidup lagi.
   */
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveJemaat = useSaveJemaat(code);
  const detail = useJemaatDetail(code);

  const form = useForm<JemaatFormValues>({
    resolver: zodResolver(jemaatFormSchema),
    mode: "onSubmit",
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

  const { isDirty, isSubmitting, submitCount } = form.formState;
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
    else router.replace(listReturn);
  };
  const rootError = form.formState.errors.root?.message;
  // `useWatch`, bukan `form.watch()`: yang kedua mengembalikan fungsi baru
  // tiap render, sehingga React Compiler melewatkan seluruh komponen ini.
  const watched = useWatch({ control: form.control });
  const missing = incompleteFields(watched);

  /**
   * `submitCount` ikut dependency, dan itu yang membuat percobaan KEDUA yang
   * ditolak pada field yang sama tetap memindahkan fokus — tanpa itu nilainya
   * tidak berubah dan efek ini diam. Penandanya dibersihkan di awal tiap
   * submit (event handler), bukan di dalam efek ini.
   */
  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    onRevealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  const onSave = form.handleSubmit(
    async (values) => {
      // Galat tingkat form dari percobaan SEBELUMNYA tidak dihapus resolver
      // (ia hanya mengurus field), jadi tanpa baris ini "Kesalahan server."
      // tetap terbaca di bawah tombol saat percobaan kedua berhasil.
      form.clearErrors("root");
      setRejectedField(null);

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
        setRejectedField(firstErrorField(error));
      }
    },
    (errors) => {
      // Galat dari klien: penanda galat server sebelumnya dibuang supaya
      // fokus tidak melompat ke field yang bukan sedang dipersoalkan.
      setRejectedField(null);
      onRevealField(Object.keys(errors).find((key) => key !== "root"));
    },
  );

  /**
   * Gerbang rute, MENYALIN guard endpoint yang sama dengan tombol yang
   * membukanya (`DAFTAR_JEMAAT` CREATE / UPDATE).
   *
   * Tombolnya memang sudah disembunyikan, tapi rutenya tetap bisa diketik
   * atau datang dari tautan lama. be-sada tetap menolak saat simpan — jadi
   * ini bukan pengaman, melainkan supaya penolakannya datang SEBELUM petugas
   * mengisi dua puluh field, bukan sesudahnya.
   */
  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return <NoFormAccess isEdit={isEdit} />;
  }

  return (
    <FormLayout
      onSubmit={onSave}
      actions={
        <FormActions
          status={
            /*
              Penanda data belum lengkap (keputusan user): peringatan, bukan
              penghalang. Jemaatnya tetap boleh disimpan dan dilengkapi nanti —
              menahan seluruh orang karena satu angka yang tidak diketahui
              justru membuat orangnya tidak tercatat sama sekali.
            */
            missing.length > 0 ? (
              <>
                Belum lengkap: {missing.join(", ")}. Jemaat tetap bisa disimpan
                dan dilengkapi nanti.
              </>
            ) : undefined
          }
        >
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
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Jemaat" : "Tambah Jemaat"}
          subtitle={detail.data?.name ?? code}
          backHref={listReturn}
          isBackPersistent
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

      {/* `empty:hidden`: tanpa peringatan duplikat dan galat, jalurnya hilang. */}
      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        <DuplicateWarning
          name={watched.name ?? ""}
          birthDate={watched.birthDate ?? ""}
          ownCode={code}
        />

        {/*
          Galat tingkat form mendapat BIDANG, bukan satu baris merah: ia
          muncul setelah user menekan Simpan dan mengira pekerjaannya selesai,
          jadi yang harus terbaca lebih dulu adalah "datanya belum tersimpan",
          baru sebabnya. Bentuknya disamakan dengan galat daftar (`DataList`).
        */}
        {rootError ? (
          <div
            role="alert"
            className="border-destructive bg-destructive/10 flex items-start gap-2 rounded-control border p-3"
          >
            <TriangleAlert
              className="text-destructive mt-0.5 size-4 shrink-0"
              aria-hidden
            />

            <div className="min-w-0">
              <p className="text-destructive text-body font-medium">
                Data belum tersimpan. Coba simpan lagi.
              </p>
              <p className="text-destructive text-body">{rootError}</p>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen.value}
        onOpenChange={isConfirmOpen.setValue}
        title="Buang perubahan?"
        description="Isian yang belum disimpan akan hilang."
        confirmLabel="Buang"
        cancelLabel="Lanjut mengisi"
        isDestructive
        onConfirm={() => router.replace(listReturn)}
      />
    </FormLayout>
  );
}

/**
 * Bawa field galat pertama ke pandangan DAN ke fokus.
 *
 * Dua sumber galat, dan keduanya butuh ini: validasi zod di klien (RHF sudah
 * memindahkan fokus lewat `shouldFocusError`, tapi di halaman ±20 field fokus
 * saja bisa mendarat tepat di bawah baris aksi yang menempel) dan `issues[]`
 * dari server sesudah submit — di jalur kedua RHF tidak memindahkan apa pun,
 * jadi tanpa `focus()` di sini halaman hanya bergeser diam-diam dan pengguna
 * keyboard tetap tertinggal di tombol Simpan.
 *
 * `preventScroll`: fokus dulu tanpa lompatan kasar peramban, lalu digulir
 * sendiri ke tengah dengan animasi.
 */
function onRevealField(field: string | null | undefined) {
  if (!field) return;

  const control = document.getElementById(field);

  if (!control) return;

  control.focus({ preventScroll: true });
  control.scrollIntoView({ block: "center", behavior: "smooth" });
}

/** Layar "tidak tersedia" untuk peran yang tidak memegang aksinya. */
function NoFormAccess({ isEdit }: { isEdit: boolean }) {
  return (
    <div className="mx-auto w-full max-w-lg">
      <PageHeader
        title={
          isEdit ? "Tidak bisa mengubah jemaat" : "Tidak bisa menambah jemaat"
        }
        backHref={JEMAAT_LIST_PATH}
        isBackPersistent
      />

      <div className="flex flex-col items-start gap-3 px-gutter">
        <p className="text-muted-foreground text-body">
          Peran Anda hanya bisa melihat data jemaat.{" "}
          {isEdit ? "Perubahan data" : "Penambahan jemaat baru"} biasanya
          dikerjakan sekretariat.
        </p>

        <p className="text-muted-foreground text-body">
          Hubungi administrator bila Anda memang seharusnya memegang akses ini.
        </p>

        <Link
          href={JEMAAT_LIST_PATH}
          className={buttonVariants({ variant: "outline" })}
        >
          Kembali ke Daftar Jemaat
        </Link>
      </div>
    </div>
  );
}
