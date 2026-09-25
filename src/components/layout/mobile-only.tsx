interface PropTypes {
  children: React.ReactNode;
}

export const MobileOnly = (props: PropTypes) => {
  const { children } = props;

  return <div className="lg:hidden">{children}</div>;
};
