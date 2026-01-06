import { TypeParams } from "@/types/utils";

export function generateSearchParams(params: TypeParams): string {
  const result: string[] = [];

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((valueChild) => {
          result.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(
              String(valueChild),
            )}`,
          );
        });
        return;
      }

      result.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  });

  return result.length ? `?${result.join("&")}` : "";
}
