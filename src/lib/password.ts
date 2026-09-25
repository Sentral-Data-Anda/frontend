import { z } from "zod";

// Cermin be-sada auth.validation.ts: urutan cek dan pesan sama persis.
const PASSWORD_PATTERN = /^(?=(.*[A-Z]){1})(?=(.*\d){3})/;

const newPasswordField = z
  .string()
  .min(1, "Mohon Lengkapi Password Baru")
  .min(8, "Password Baru tidak boleh kurang dari 8 karakter")
  .max(25, "Password Baru tidak boleh lebih dari 25 karakter")
  .regex(PASSWORD_PATTERN, "Password Harus Mengandung Huruf Besar dan 3 Angka");

const confirmPasswordField = z
  .string()
  .min(1, "Mohon Lengkapi Konfirmasi Password")
  .max(25, "Konfirmasi Password tidak boleh lebih dari 25 karakter");

const isConfirmed = (form: { newPassword: string; confirmPassword: string }) =>
  form.confirmPassword === form.newPassword;

const MISMATCH = {
  path: ["confirmPassword"],
  message: "Konfirmasi Password Tidak Sama Dengan Password Baru",
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
      .min(1, "Mohon Lengkapi Password Lama")
      .max(25, "Password Lama tidak boleh lebih dari 25 karakter"),
    newPassword: newPasswordField,
    confirmPassword: confirmPasswordField,
  })
  .refine(isConfirmed, MISMATCH);

export const PASSWORD_HINT =
  "8–25 karakter, dengan satu huruf besar dan tiga angka.";
