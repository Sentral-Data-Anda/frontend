export type TypeSwal = {
  type?: string;
  text?: any;
};

export type TypeConfirmSwal = {
  title: string;
  labelConfirm: string;
  onConfirm: () => void;
};
