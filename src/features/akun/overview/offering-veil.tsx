export const OfferingVeil = () => (
  <div>
    <ul aria-hidden className="select-none">
      {[0, 1, 2].map((row) => (
        <li
          key={row}
          className="border-border flex h-14 items-center gap-3 border-b last:border-b-0"
        >
          <div className="flex-1 space-y-1.5 blur-[2px]">
            <span className="bg-muted block h-3 w-40 max-w-full rounded" />
            <span className="bg-muted/60 block h-2.5 w-24 rounded" />
          </div>
          <span className="text-muted-foreground text-body tracking-widest blur-[2px]">
            Rp •••••
          </span>
        </li>
      ))}
    </ul>

    <p className="text-muted-foreground mt-3 text-body">
      Riwayat dan nominal disembunyikan. Pilih Tampilkan untuk melihatnya.
    </p>
  </div>
);
