// Pintu layar ke primitif `Badge` (components/ui), sama seperti
// `common/control/button`. Layar tidak mengimpor components/ui langsung
// (ditegakkan lint); varian status (`success`, `neutral`, `due`, …) hidup di
// primitifnya supaya satu sumber.
export { Badge, badgeVariants } from "@/components/ui/badge";
