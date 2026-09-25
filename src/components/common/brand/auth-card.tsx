interface PropTypes {
  children: React.ReactNode;
}

export const AuthCard = (props: PropTypes) => {
  const { children } = props;

  return (
    <div className="bg-background w-full max-w-sm rounded-2xl p-6 shadow-sm md:p-8">
      {children}
    </div>
  );
};
