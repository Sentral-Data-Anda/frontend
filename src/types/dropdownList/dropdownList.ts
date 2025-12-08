export interface CustomOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownGlobal {
  id: number;
  code: string;
  name: string;
}

export interface DropdownBapel {
  id: number;
  code: string;
  name: string;
}

export interface DropdownRoleUser {
  id: number;
  code: string;
  name: string;
}

export interface DropdownRoom {
  id: number;
  code: string;
  name: string;
}

export interface DropdownTypeItem {
  id: number;
  code: string;
  name: string;
}

export interface DropdownPelayan {
  value: string;
  label: string;
  jemaatId: string;
  disabled: boolean;
}

export interface DropdownSkillMusic {
  id: number;
  name: string;
}

export interface DropdownTemplate {
  id: number;
  code: string;
  name: string;
}
