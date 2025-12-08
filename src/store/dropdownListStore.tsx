import { ComboboxItem } from "@mantine/core";
import { StateCreator } from "zustand";

import { customNotification } from "@/utils/notification";
import { DropdownGlobal, DropdownPelayan, TypeParams } from "@/types";
import { dropdownListService } from "@/services";

export interface DropdownListState {
  isLoadingDropdown: boolean;

  selectBapel: ComboboxItem[];
  fetchDropdownBapel: () => Promise<void>;

  selectRoleUser: ComboboxItem[];
  fetchDropdownRoleUser: () => Promise<void>;

  selectRoom: ComboboxItem[];
  fetchDropdownRoom: () => Promise<void>;

  selectTypeItem: ComboboxItem[];
  fetchDropdownTypeItem: () => Promise<void>;

  selectRolePelayan: ComboboxItem[];
  fetchDropdownRolePelayan: (_value?: TypeParams) => Promise<void>;

  selectPelayan: ComboboxItem[];
  fetchDropdownPelayan: (_value?: TypeParams) => Promise<void>;

  selectSkillMusic: ComboboxItem[];
  fetchDropdownSkillMusic: () => Promise<void>;

  selectJemaat: ComboboxItem[];
  fetchDropdownJemaat: () => Promise<void>;

  selectTemplateJadwal: ComboboxItem[];
  fetchDropdownTemplateJadwal: (_value?: TypeParams) => Promise<void>;
}

const dropdownListStore: StateCreator<DropdownListState> = (set) => ({
  isLoadingDropdown: false,

  selectBapel: [],
  fetchDropdownBapel: async () => {
    try {
      set({ isLoadingDropdown: true });

      const response = await dropdownListService.getBapel();

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.id),
          };
        });

        set({ selectBapel: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectBapel: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  selectRoleUser: [],
  fetchDropdownRoleUser: async () => {
    try {
      set({ isLoadingDropdown: true });
      const response = await dropdownListService.getRoleUser();

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.id),
          };
        });

        set({ selectRoleUser: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectRoleUser: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  selectRoom: [],
  fetchDropdownRoom: async () => {
    try {
      set({ isLoadingDropdown: true });
      const response = await dropdownListService.getRoom();

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.id),
          };
        });

        set({ selectRoom: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectRoom: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  selectTypeItem: [],
  fetchDropdownTypeItem: async () => {
    try {
      set({ isLoadingDropdown: true });
      const response = await dropdownListService.getTypeItem();

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.id),
          };
        });

        set({ selectTypeItem: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectTypeItem: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  selectRolePelayan: [],
  fetchDropdownRolePelayan: async (params?: TypeParams) => {
    try {
      set({ isLoadingDropdown: true });
      const response = await dropdownListService.getRolePelayan(params ?? {});

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.id),
          };
        });

        set({ selectRolePelayan: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectRolePelayan: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  selectPelayan: [],
  fetchDropdownPelayan: async (params?: TypeParams) => {
    try {
      set({ isLoadingDropdown: true });
      const response = await dropdownListService.getPelayan(params ?? {});

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownPelayan) => {
          return {
            label: value.label,
            value: String(value.value),
            disabled: value.disabled,
          };
        });

        set({ selectPelayan: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectPelayan: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  selectSkillMusic: [],
  fetchDropdownSkillMusic: async () => {
    try {
      set({ isLoadingDropdown: true });
      const response = await dropdownListService.getSkillMusic();

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.id),
          };
        });

        set({ selectSkillMusic: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectSkillMusic: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  selectJemaat: [],
  fetchDropdownJemaat: async () => {
    try {
      set({ isLoadingDropdown: true });

      const response = await dropdownListService.getJemaat();

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.id),
          };
        });

        set({ selectJemaat: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectJemaat: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  selectTemplateJadwal: [],
  fetchDropdownTemplateJadwal: async (params?: TypeParams) => {
    try {
      set({ isLoadingDropdown: true });

      const response = await dropdownListService.getTemplateJadwal(
        params ?? {},
      );

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.id),
          };
        });

        set({ selectTemplateJadwal: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectTemplateJadwal: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },
});

export default dropdownListStore;
