import { MenuTile, MenuTileGrid } from "@/components/common/navigation";
import { PageHeader } from "@/components/layout";
import {
  MENU_DESCRIPTION,
  leafIcon,
  menuHref,
  type MenuSlug,
} from "@/config/menu";
import type { MenuNode } from "@/types/menu";

interface PropTypes {
  domain: MenuNode;
}

export const DomainScreen = (props: PropTypes) => {
  const { domain } = props;

  return (
    <div className="pb-6">
      <PageHeader title={domain.name} backHref="/" />

      <div className="px-gutter pt-2">
        <MenuTileGrid label={`Layar ${domain.name}`}>
          {domain.children.map((leaf) => (
            <MenuTile
              key={leaf.publicId}
              href={menuHref(domain.slug, leaf.slug)}
              domainSlug={domain.slug}
              icon={leafIcon(leaf.slug, domain.slug)}
              title={leaf.name}
              description={MENU_DESCRIPTION[leaf.slug as MenuSlug]}
            />
          ))}
        </MenuTileGrid>
      </div>
    </div>
  );
};
