import { ImageResponse } from "next/og";

import { brand } from "@/config/brand";

/**
 * Favicon (tab browser). Menggantikan `favicon.ico` bawaan create-next-app.
 *
 * Pada 32px wordmark 4 huruf tidak terbaca, jadi di sini hanya huruf pertama.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: brand.icon.background,
        color: brand.icon.foreground,
        fontSize: 22,
        fontWeight: 700,
        borderRadius: 7,
      }}
    >
      {brand.wordmark.charAt(0)}
    </div>,
    { ...size },
  );
}
