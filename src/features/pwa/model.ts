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

export function serviceWorkerUrl(): string {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || "dev";
  return `/sw.js?v=${encodeURIComponent(buildId)}`;
}

export function isServiceWorkerEnabled(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENABLE_SW === "1"
  );
}
