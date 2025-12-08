import { DetailAuth } from "@/types";
import { StateCreator } from "zustand";

export interface DetailUserState {
  detailUser: DetailAuth | undefined;
  setDetailUser: (_value: DetailAuth | undefined) => void;
  clearDetailUser: () => void;
}

const detailUserStore: StateCreator<DetailUserState> = (set) => ({
  detailUser: undefined,
  setDetailUser: (value) => {
    set({ detailUser: value });
  },
  clearDetailUser: () => {
    set({
      detailUser: undefined,
    });
    window.location.reload();
  },
});

export default detailUserStore;
