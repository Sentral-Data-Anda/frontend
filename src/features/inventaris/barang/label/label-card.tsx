import { Fragment } from "react";

import { QrCode } from "@/components/common/display";

import { codePartsOf, type LabelAsset } from "./model";

interface PropTypes {
  asset: LabelAsset;
  url: string;
}

export const LabelCard = (props: PropTypes) => {
  const { asset, url } = props;

  return (
    <li className="outline-border flex h-[33.9mm] w-[64mm] items-center gap-[2mm] overflow-hidden rounded-[2mm] px-[2.5mm] outline-1 -outline-offset-1 outline-dashed print:rounded-none print:outline-none">
      <QrCode value={url} className="size-[26mm] shrink-0" />
      <div className="min-w-0 flex-1 text-[8pt] leading-tight">
        <p className="font-mono font-semibold">
          {codePartsOf(asset.code).map((part, index) => (
            <Fragment key={index}>
              {index > 0 ? <wbr /> : null}
              {part}
            </Fragment>
          ))}
        </p>
        <p className="mt-[1.5mm] line-clamp-2 break-words" title={asset.name}>
          {asset.name}
        </p>
      </div>
    </li>
  );
};
