import { ComboboxItem } from "@mantine/core";
import { StateCreator } from "zustand";

import { customNotification } from "@/utils/notification";
import { DropdownGlobal, DropdownPelayan, TypeParams } from "@/types";
import { dropdownListService } from "@/services";

export interface DropdownListState {
  isLoadingDropdown: boolean;

  isLoadingRegencies: boolean;
  isLoadingDistrict: boolean;
  isLoadingVillages: boolean;

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
  fetchDropdownJemaat: (_value?: TypeParams) => Promise<void>;

  selectTemplateJadwal: ComboboxItem[];
  fetchDropdownTemplateJadwal: (_value?: TypeParams) => Promise<void>;

  selectProfession: ComboboxItem[];
  fetchDropdownProfession: () => Promise<void>;

  selectEtnicGroup: ComboboxItem[];
  fetchDropdownEtnicGroup: () => Promise<void>;

  selectProvinces: ComboboxItem[];
  fetchDropdownProvinces: () => Promise<void>;

  selectRegencies: ComboboxItem[];
  fetchDropdownRegencies: (_value?: TypeParams) => Promise<void>;

  selectDistricts: ComboboxItem[];
  fetchDropdownDistricts: (_value?: TypeParams) => Promise<void>;

  selectVillages: ComboboxItem[];
  fetchDropdownVillages: (_value?: TypeParams) => Promise<void>;

  selectZoneChurch: ComboboxItem[];
  fetchDropdownZoneChurch: () => Promise<void>;
}

const dropdownListStore: StateCreator<DropdownListState> = (set) => ({
  isLoadingDropdown: false,

  isLoadingRegencies: false,
  isLoadingDistrict: false,
  isLoadingVillages: false,

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
  fetchDropdownJemaat: async (params?: TypeParams) => {
    try {
      set({ isLoadingDropdown: true });

      console.log("PARAMS", params);

      const response = await dropdownListService.getJemaat(params ?? {});

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

  selectProfession: [],
  fetchDropdownProfession: async () => {
    try {
      set({ isLoadingDropdown: true });

      const response = await dropdownListService.getProfession();

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.id),
          };
        });

        set({ selectProfession: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectProfession: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  selectEtnicGroup: [],
  fetchDropdownEtnicGroup: async () => {
    try {
      set({ isLoadingDropdown: true });

      const response = await dropdownListService.getEtnicGroup();

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.id),
          };
        });

        set({ selectEtnicGroup: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectEtnicGroup: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  selectProvinces: [],
  fetchDropdownProvinces: async () => {
    try {
      set({ isLoadingDropdown: true });

      const response = await dropdownListService.getProvinces();

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.code),
          };
        });

        set({ selectProvinces: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectProvinces: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },

  selectRegencies: [],
  fetchDropdownRegencies: async (params?: TypeParams) => {
    try {
      set({ isLoadingRegencies: true });

      const response = await dropdownListService.getRegencies(params ?? {});

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.code),
          };
        });

        set({ selectRegencies: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectRegencies: [] });
    } finally {
      set({ isLoadingRegencies: false });
    }
  },

  selectDistricts: [],
  fetchDropdownDistricts: async (params?: TypeParams) => {
    try {
      set({ isLoadingDistrict: true });

      const response = await dropdownListService.getDistricts(params ?? {});

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.code),
          };
        });

        set({ selectDistricts: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectDistricts: [] });
    } finally {
      set({ isLoadingDistrict: false });
    }
  },

  selectVillages: [],
  fetchDropdownVillages: async (params?: TypeParams) => {
    try {
      set({ isLoadingVillages: true });

      const response = await dropdownListService.getVillages(params ?? {});

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.code),
          };
        });

        set({ selectVillages: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectVillages: [] });
    } finally {
      set({ isLoadingVillages: false });
    }
  },

  selectZoneChurch: [],
  fetchDropdownZoneChurch: async () => {
    try {
      set({ isLoadingDropdown: true });

      const response = await dropdownListService.getZoneChurch();

      if (response.status === 200) {
        const select = response?.data?.map((value: DropdownGlobal) => {
          return {
            label: value.name,
            value: String(value.id),
          };
        });

        set({ selectZoneChurch: select });
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      set({ selectZoneChurch: [] });
    } finally {
      set({ isLoadingDropdown: false });
    }
  },
});

export default dropdownListStore;
