import {
  DescriptionItem,
  DescriptionList,
  DETAIL_LINK as LINK,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { cn } from "@/lib/utils";

import { bankAccountOf } from "../model";
import type { Supplier } from "../types";
import { SupplierStatus } from "../ui";

interface PropTypes {
  supplier: Supplier;
}

export const ProfilePanel = (props: PropTypes) => {
  const { supplier } = props;

  const bankAccount = bankAccountOf(supplier);

  return (
    <Panel label="Data supplier">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Status">
          <SupplierStatus isActive={supplier.isActive} />
        </DescriptionItem>
        <DescriptionItem label="Kontak">
          <OptionalText text={supplier.contactPerson} empty="Tanpa kontak" />
        </DescriptionItem>
        <DescriptionItem label="Telepon">
          <a
            href={`tel:${supplier.phone}`}
            className={cn(LINK, "tabular-nums")}
          >
            {supplier.phone}
          </a>
        </DescriptionItem>
        <DescriptionItem label="Email">
          {supplier.email ? (
            <a href={`mailto:${supplier.email}`} className={LINK}>
              {supplier.email}
            </a>
          ) : (
            <OptionalText empty="Tanpa email" />
          )}
        </DescriptionItem>
        <DescriptionItem label="Alamat" isWide>
          {supplier.address ?? <OptionalText empty="Tanpa alamat" />}
        </DescriptionItem>
        <DescriptionItem label="NPWP">
          <span className="tabular-nums">
            <OptionalText text={supplier.npwp} empty="Tanpa NPWP" />
          </span>
        </DescriptionItem>
        <DescriptionItem label="Rekening" isWide>
          {bankAccount ? (
            <span className="tabular-nums">{bankAccount}</span>
          ) : (
            <OptionalText empty="Tanpa rekening" />
          )}
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
