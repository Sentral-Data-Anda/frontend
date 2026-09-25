import { shellWidth, shellWidthFull } from "./shell-width";

interface PropTypes {
  size?: "default" | "full";
  children: React.ReactNode;
}

export const PageContainer = (props: PropTypes) => {
  const { size = "default", children } = props;

  return (
    <div className={size === "full" ? shellWidthFull : shellWidth}>
      {children}
    </div>
  );
};
