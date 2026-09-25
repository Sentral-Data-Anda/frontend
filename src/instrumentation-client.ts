import { installErrorListeners } from "@/features/observability";

try {
  installErrorListeners();
} catch {
  // Pelapor galat tidak boleh menjatuhkan aplikasi.
}
