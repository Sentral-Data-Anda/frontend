import { TriangleAlert } from "lucide-react";

interface PropTypes {
  title: string;
  message: string;
}

export const FormAlert = (props: PropTypes) => {
  const { title, message } = props;

  return (
    <div
      role="alert"
      className="border-destructive bg-destructive/10 flex items-start gap-2 rounded-control border p-3"
    >
      <TriangleAlert
        className="text-destructive mt-0.5 size-4 shrink-0"
        aria-hidden
      />

      <div className="min-w-0">
        <p className="text-destructive text-body font-medium">{title}</p>
        <p className="text-destructive text-body">{message}</p>
      </div>
    </div>
  );
};
