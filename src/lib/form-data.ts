export type FormDataValue = string | number | boolean | null | undefined;

export type UploadPart = {
  field: string;
  file: File;
  showOnWebsite?: boolean;
};

const flagOf = (value: boolean) => (value ? "1" : "0");

// be-sada membaca boolean multipart sebagai `=== "1"` dan memasangkan
// `showOnWebsite` ke berkas `image` menurut urutan.
export const toFormData = (
  fields: Record<string, FormDataValue>,
  parts: readonly UploadPart[] = [],
): FormData => {
  const body = new FormData();

  for (const [name, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === "") continue;

    body.append(
      name,
      typeof value === "boolean" ? flagOf(value) : String(value),
    );
  }

  for (const part of parts) {
    body.append(part.field, part.file, part.file.name);

    if (part.showOnWebsite !== undefined) {
      body.append("showOnWebsite", flagOf(part.showOnWebsite));
    }
  }

  return body;
};
