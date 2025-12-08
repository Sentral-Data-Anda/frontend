import { Access } from "../user-management/access";

export interface Role {
  id: number;
  name: string;
  isAdmin: boolean;
  access: Access[];
}

export interface FormRole {
  name: string;
  isAdmin: boolean;
  accessRights: number[];
}
