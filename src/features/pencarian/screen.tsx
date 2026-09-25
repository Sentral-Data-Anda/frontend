"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import {
  DomainTileGrid,
  MenuTile,
  MenuTileGrid,
} from "@/components/common/navigation";
import { PageHeader } from "@/components/layout";
import { leafIcon, menuHref } from "@/config/menu";
import { useSession } from "@/features/auth";

import { descriptionOf, searchModules } from "./model";

export const PencarianScreen = () => {
  const session = useSession();

  const [searchData, setSearchData] = useState("");

  const result = searchModules(session.menu, searchData);

  return (
    <div className="pb-6">
      <PageHeader title="Pencarian" backHref="/" />

      <div className="px-gutter pb-4">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
            aria-hidden
          />

          <Input
            type="search"
            value={searchData}
            onChange={(event) => setSearchData(event.target.value)}
            placeholder="Cari modul atau layar"
            aria-label="Cari modul atau layar"
            className="pl-8"
          />
        </div>
      </div>

      <p className="sr-only" role="status">
        {result.kind === "screens" ? `${result.hits.length} layar cocok` : ""}
      </p>

      <div className="px-gutter">
        {result.kind === "domains" ? (
          <DomainTileGrid domains={result.domains} />
        ) : result.hits.length === 0 ? (
          <EmptyState
            title="Tidak ada modul atau layar yang cocok"
            description="Coba kata lain, mis. nama layar atau modulnya."
          />
        ) : (
          <MenuTileGrid label="Hasil pencarian">
            {result.hits.map(({ domain, leaf }) => (
              <MenuTile
                key={leaf.publicId}
                href={menuHref(domain.slug, leaf.slug)}
                domainSlug={domain.slug}
                domainLabel={domain.name}
                icon={leafIcon(leaf.slug, domain.slug)}
                title={leaf.name}
                description={descriptionOf(leaf)}
              />
            ))}
          </MenuTileGrid>
        )}
      </div>
    </div>
  );
};
