/**
 * Penanda "contoh data" untuk widget yang datanya fixture (endpoint be-sada
 * belum ada). Widget itu hanya dirender di luar production (`SHOW_DUMMY`),
 * jadi tanda ini ikut hilang di production.
 */
export function DummyTag() {
  return (
    <span className="border-border text-muted-foreground inline-block rounded-sm border border-dashed px-1.5 text-caption font-medium tracking-normal normal-case italic">
      contoh data
    </span>
  );
}
