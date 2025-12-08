import persistedDetailUserStore, {
  DetailUserState,
} from "@/store/detailAuthStore";
import dropdownListStore, {
  DropdownListState,
} from "@/store/dropdownListStore";
import { create } from "zustand";

type StoreInitializer<T> = (set: any, get: any, api: any) => T;

function combineStores<T extends object>(...stores: StoreInitializer<any>[]) {
  return (set: any, get: any, api: any) =>
    stores.reduce(
      (acc, store) => ({
        ...acc,
        ...store(set, get, api),
      }),
      {} as T,
    );
}

type RootStore = DetailUserState & DropdownListState;

export const useZustandStore = create<RootStore>()(
  combineStores(persistedDetailUserStore, dropdownListStore),
);

function stripFunctions<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(obj).filter(([_, value]) => typeof value !== "function"),
  ) as Partial<T>;
}

useZustandStore.subscribe((state, prevState) => {
  console.log("Zustand state changed:");
  console.log("Prev:", stripFunctions(prevState));
  console.log("Next:", stripFunctions(state));
});
