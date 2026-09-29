import { LabelCard } from "./label-card";
import { labelUrlOf, type LabelAsset } from "./model";

interface PropTypes {
  assets: LabelAsset[];
  siteUrl: string;
  caption: string;
}

export const LabelSheet = (props: PropTypes) => {
  const { assets, siteUrl, caption } = props;

  return (
    <figure className="border-border bg-card text-card-foreground mx-auto w-full max-w-[210mm] rounded-sm border p-[8mm] shadow-sm break-after-page last:break-after-auto print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <figcaption className="text-muted-foreground mb-3 text-caption print:hidden">
        {caption}
      </figcaption>
      <ul className="grid auto-rows-[33.9mm] grid-cols-[repeat(auto-fill,64mm)] print:grid-cols-[repeat(3,64mm)] print:grid-rows-[repeat(8,33.9mm)]">
        {assets.map((asset) => (
          <LabelCard
            key={asset.code}
            asset={asset}
            url={labelUrlOf(siteUrl, asset.code)}
          />
        ))}
      </ul>
    </figure>
  );
};
