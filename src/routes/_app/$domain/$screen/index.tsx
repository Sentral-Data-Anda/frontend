import { createFileRoute, notFound } from "@tanstack/react-router";

// Layar yang belum dibangun di bawah domain mana pun.
export const Route = createFileRoute("/_app/$domain/$screen/")({
  beforeLoad: () => {
    throw notFound();
  },
});
