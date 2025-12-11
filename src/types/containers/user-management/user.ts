export interface User {
  code: string;
  username: string;
  status: number;
  lastLogin: string | null;
  roleUser: {
    id: number;
    name: string;
  };
  jemaat: {
    id: number;
    code: string;
    name: string;
  };
}

export interface FormUser {
  jemaatId: string | null;
  roleUserId: string | null;
}

export interface NewUser {
  name: string;
  username: string;
  password: string;
}
