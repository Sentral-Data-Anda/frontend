"use client";

import { useState, useEffect } from "react";

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (
      e: Event & { prompt?: () => void; userChoice?: Promise<any> },
    ) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handler as EventListener,
      );
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log("Install result:", choice);
    setShow(false);
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <button
      onClick={handleInstall}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        padding: "10px 15px",
        background: "#0b74de",
        color: "#fff",
        border: "none",
        borderRadius: 5,
      }}>
      Install App
    </button>
  );
}
