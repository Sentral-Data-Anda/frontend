export const LoadingGlobal = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      className="bg-background/60 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[1px]"
    >
      <span className="border-muted border-t-primary size-10 animate-spin rounded-full border-4" />
      <span className="sr-only">Memuat…</span>
    </div>
  );
};
