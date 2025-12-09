"use client";
import { useEffect } from "react";

const nodeENV = process.env.NODE_ENV;

export function RegisterSW() {
  useEffect(() => {
    if (nodeENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered:", reg);
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    }
  }, [nodeENV]);

  return null;
}
