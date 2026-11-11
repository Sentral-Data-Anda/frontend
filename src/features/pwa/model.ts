export function isStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const iosStandalone = (
    window.navigator as Navigator & { standalone?: boolean }
  ).standalone;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosStandalone === true
  );
}

export function isIOS(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ua = window.navigator.userAgent;

  const isIPadOS = /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1;

  return /iPad|iPhone|iPod/.test(ua) || isIPadOS;
}

export function isManualInstallGuideNeeded(): boolean {
  return isIOS() && !isStandalone();
}

// `typeof`: di `bun test` tidak ada Vite yang mengisi konstanta ini.
const BUILD_ID = typeof __BUILD_ID__ === "undefined" ? "" : __BUILD_ID__;

export function serviceWorkerUrl(buildId: string = BUILD_ID): string {
  return `/sw.js?v=${encodeURIComponent(buildId || "dev")}`;
}

export function isServiceWorkerEnabled(
  flags: { isProduction: boolean; isOptedIn: boolean } = {
    isProduction: Boolean(import.meta.env.PROD),
    isOptedIn: import.meta.env.VITE_ENABLE_SW === "1",
  },
): boolean {
  return flags.isProduction || flags.isOptedIn;
}
