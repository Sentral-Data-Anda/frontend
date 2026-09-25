import { installErrorListeners } from "@/features/observability/install-listeners";

try {
  installErrorListeners();
} catch {
  // Pelapor galat tidak boleh menjatuhkan aplikasi.
}
