export interface DetailAuth {
  id: number;
  code: string;
  username: string;
  status: number;
  lastLogin: string;
  roleUser: {
    id: number;
    name: string;
    isAdmin: boolean;
    access: {
      id: number;
      name: string;
    }[];
  };
  jemaat: {
    id: number;
    code: string;
    name: string;
    gender: string;
    birthDate: string;
    address: string;
    email: string;
    phone: string;
    status: string;
  };
}

export interface ContainerAuthProps {
  getOneUser: (code: string) => void;
  user: DetailAuth | null;
}
