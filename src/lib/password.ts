import { z } from "zod";

// Cermin be-sada auth.validation.ts: urutan cek dan pesan sama persis.
const PASSWORD_PATTERN = /^(?=(.*[A-Z]){1})(?=(.*\d){3})/;

const newPasswordField = z
  .string()
  .min(8, "Password baru minimal 8 karakter")
  .max(25, "Password baru maksimal 25 karakter")
  .regex(PASSWORD_PATTERN, "Password harus mengandung huruf besar dan 3 angka");

const confirmPasswordField = z
  .string()
  .max(25, "Konfirmasi password maksimal 25 karakter");

const isConfirmed = (form: { newPassword: string; confirmPassword: string }) =>
  form.confirmPassword === form.newPassword;

const MISMATCH = {
  path: ["confirmPassword"],
  message: "Konfirmasi password tidak sama dengan password baru",
};

export const firstPasswordSchema = z
  .object({
    newPassword: newPasswordField,
    confirmPassword: confirmPasswordField,
  })
  .refine(isConfirmed, MISMATCH);

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, "Mohon lengkapi password lama")
      .max(25, "Password lama maksimal 25 karakter"),
    newPassword: newPasswordField,
    confirmPassword: confirmPasswordField,
  })
  .refine(isConfirmed, MISMATCH);

export const PASSWORD_HINT =
  "8–25 karakter, dengan satu huruf besar dan tiga angka.";
