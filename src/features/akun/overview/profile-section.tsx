"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/common/control";
import { Avatar, Panel } from "@/components/common/display";
import { useSession } from "@/features/auth";
import { cn } from "@/lib/utils";

import { profileKey } from "../api";
import { orDash, roleLabels } from "../model";
import { useReveal } from "../use-reveal";

import { ProfileDetails } from "./profile-details";
import { ReadOnlyField } from "./read-only-field";

const DETAILS_ID = "profile-details";

export const ProfileSection = () => {
  const session = useSession();
  const { isShown, onToggle } = useReveal(profileKey);
  const jemaat = session.jemaat;
  const name = jemaat?.name ?? session.username;
  const roles = roleLabels(jemaat?.roleJemaat);

  return (
    <Panel label="Profil">
      <div className="flex items-center gap-3 px-gutter py-4">
        <Avatar label={name} />
        <div className="min-w-0">
          <p className="truncate text-title font-semibold">{name}</p>
          <p className="text-muted-foreground truncate text-body">
            {jemaat
              ? `${session.roleUser.name} · ${session.username}`
              : session.roleUser.name}
          </p>
        </div>
      </div>

      {jemaat ? (
        <>
          <dl className="border-hairline divide-hairline divide-y border-t px-gutter">
            <ReadOnlyField label="Kode jemaat">
              {orDash(jemaat.code)}
            </ReadOnlyField>
            <ReadOnlyField label="Jabatan" isStacked>
              {roles.length ? roles.join("; ") : "—"}
            </ReadOnlyField>
          </dl>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            aria-expanded={isShown}
            aria-controls={DETAILS_ID}
            onClick={onToggle}
            className="border-hairline h-11 w-full justify-between rounded-none border-x-0 border-t border-b-0 px-gutter"
          >
            {isShown ? "Sembunyikan data pribadi" : "Lihat data pribadi"}
            <ChevronDown
              className={cn(
                "text-muted-foreground size-4 transition-transform motion-reduce:transition-none",
                isShown && "rotate-180",
              )}
              aria-hidden
            />
          </Button>

          <div id={DETAILS_ID} className="empty:hidden">
            {isShown ? <ProfileDetails /> : null}
          </div>

          <p className="text-muted-foreground border-hairline border-t px-gutter py-3 text-caption">
            Data diambil dari catatan jemaat. Bila keliru, hubungi sekretariat.
          </p>
        </>
      ) : (
        <p className="border-hairline text-muted-foreground border-t px-gutter py-3 text-body">
          Akun ini belum terhubung ke data jemaat.
        </p>
      )}
    </Panel>
  );
};
