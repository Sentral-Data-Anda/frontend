// Re-export sementara, BUKAN wrapper sungguhan. Wrapper berkontrak (varian,
// prop yang dipersempit sesuai kebutuhan layar) dibangun di fase berikutnya
// begitu kebutuhan nyata layar pertama diketahui. Re-export ini ada supaya
// src/app/** tidak pernah menyentuh primitif shadcn secara langsung — kalau
// tidak, 61 layar berikutnya lahir dengan kebiasaan mengimpor primitif yang
// salah sejak hari pertama.
export { Button, buttonVariants } from "@/components/ui/button";
