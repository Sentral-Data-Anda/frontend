import { DESKTOP_MEDIA_QUERY, TABLE_MEDIA_QUERY } from "@/hooks/use-media";

/**
 * `matchMedia` tiruan untuk `useIsDesktop`. happy-dom punya `matchMedia`
 * sendiri, tapi lebarnya bawaan 1024px — tepat di batas lg — sehingga mode
 * yang terpilih bergantung pada pembulatan rem, bukan pada test-nya.
 *
 * `onResize` memicu listener `change` seperti browser saat jendela melewati
 * batas, supaya perpindahan mode bisa diuji.
 */
export function onStubViewport(isDesktop: boolean) {
  const original = window.matchMedia;
  const listeners = new Set<() => void>();
  let matches = isDesktop;

  window.matchMedia = ((query: string) => ({
    get matches() {
      return (
        matches &&
        (query === DESKTOP_MEDIA_QUERY || query === TABLE_MEDIA_QUERY)
      );
    },
    media: query,
    addEventListener: (_type: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      listeners.delete(listener),
  })) as unknown as typeof window.matchMedia;

  return {
    onResize: (next: boolean) => {
      matches = next;
      for (const listener of listeners) listener();
    },
    onRestore: () => {
      window.matchMedia = original;
    },
  };
}
