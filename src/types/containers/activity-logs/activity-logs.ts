export interface Logs {
  id: number;
  action: string;
  model: string;
  recordId: string;
  oldData: string;
  newData: string;
  createdAt: string;
  user: {
    name: string;
  };
}
