import { DataList } from "@/components/common/list";

import { useTugasSayaAll } from "../api";

import {
  tugasSayaKeyOf,
  tugasSayaTable,
  TugasSayaListItemRow,
} from "./tugas-saya-item";

export const TugasSayaPanel = () => {
  const query = useTugasSayaAll();

  return (
    <DataList
      loadingShape="trailing"
      items={query.data ?? []}
      getKey={tugasSayaKeyOf}
      label="Daftar tugas saya"
      isLoading={query.isPending}
      isRefreshing={query.isFetching}
      error={query.error}
      onRetry={query.refetch}
      emptyTitle="Belum ada tugas pelayanan yang tercatat"
      table={tugasSayaTable}
    >
      {(item) => <TugasSayaListItemRow item={item} />}
    </DataList>
  );
};
