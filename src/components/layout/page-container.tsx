import { shellWidth, shellWidthFull } from "./shell-width";

export function PageContainer({
  size = "default",
  children,
}: {
  size?: "default" | "full";
  children: React.ReactNode;
}) {
  return (
    <div className={size === "full" ? shellWidthFull : shellWidth}>
      {children}
    </div>
  );
}
