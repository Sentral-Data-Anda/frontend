"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  type QueryKey,
} from "@tanstack/react-query";

import type { DataListPagination } from "@/components/common/data-list";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { toApiQuery, type ListState } from "@/hooks/use-list-params";
import type { ApiListResponse } from "@/types/api";

/**
 * Halaman berikutnya, atau `undefined` bila sudah habis.
 *
 * Dibaca dari `lastPageParam`, bukan `allPages.length`: halaman yang dijawab
 * 404 (`fetchList` → `totalPage: 0`) tetap menghentikan akumulasi alih-alih
 * membuat indeks bergeser.
 */
export const getNextPageParam = (
  lastPage: Pick<ApiListResponse<unknown>, "totalPage">,
  _allPages: unknown,
  lastPageParam: number,
): number | undefined =>
  lastPageParam < lastPage.totalPage ? lastPageParam + 1 : undefined;

/**
 * Data daftar untuk `DataList`, dengan pola ambil yang berbeda per lebar:
 *
 * - desktop (≥ lg): satu halaman per `useQuery`, halaman dari `?page=` URL —
 *   bisa di-bookmark dan di-back.
 * - mobile/tablet: `useInfiniteQuery`, halaman ditumpuk; `?page=` diabaikan.
 *   Kuncinya menyertakan filter tapi TIDAK halaman, jadi ganti cari/status =
 *   kunci baru = daftar mulai lagi dari halaman 1, tanpa reset manual.
 *
 * Kedua hook selalu dipanggil (aturan hooks), hanya satu yang `enabled`.
 * Cache keduanya terpisah (`"infinite"` di kunci) karena bentuk datanya beda;
 * resize melewati lg hanya memindahkan pembacaan ke cache satunya, tidak
 * pernah mencampur halaman. Saat mode belum diketahui (hidrasi, lihat
 * `useIsDesktop`) tidak ada yang mengambil data dan `DataList` menampilkan
 * skeleton — satu render, lalu tepat satu permintaan.
 *
 * `queryKey` adalah awalan milik fitur (mis. `jemaatKeys.lists()`), supaya
 * invalidasi awalan itu setelah menyimpan mengenai kedua mode sekaligus.
 */
export function useListQuery<T>({
  queryKey,
  fetchPage,
  params,
}: {
  queryKey: QueryKey;
  /** `apiQuery` sudah berbentuk query string be-sada (`toApiQuery`). */
  fetchPage: (apiQuery: string) => Promise<ApiListResponse<T>>;
  params: ListState;
}) {
  const isDesktop = useIsDesktop();
  const pageQuery = toApiQuery(params);
  const firstPageQuery = toApiQuery({ ...params, page: 1 });

  const pages = useQuery({
    queryKey: [...queryKey, pageQuery],
    queryFn: () => fetchPage(pageQuery),
    placeholderData: keepPreviousData,
    enabled: isDesktop === true,
  });

  const more = useInfiniteQuery({
    queryKey: [...queryKey, "infinite", firstPageQuery],
    queryFn: ({ pageParam }) =>
      fetchPage(toApiQuery({ ...params, page: pageParam })),
    initialPageParam: 1,
    getNextPageParam,
    placeholderData: keepPreviousData,
    enabled: isDesktop === false,
  });

  if (isDesktop) {
    return {
      items: pages.data?.data,
      totalData: pages.data?.totalData,
      isLoading: pages.isPending,
      isRefreshing: pages.isFetching,
      error: pages.error,
      onRetry: () => void pages.refetch(),
      pagination: {
        mode: "pages",
        page: params.page,
        totalPage: pages.data?.totalPage ?? 0,
        onPickPage: params.onPickPage,
      } satisfies DataListPagination,
    };
  }

  const loaded = more.data?.pages;

  return {
    items: loaded?.flatMap((page) => page.data),
    totalData: loaded?.[0]?.totalData,
    // Juga `true` selama mode belum diketahui: query-nya belum `enabled`.
    isLoading: more.isPending,
    // Memuat halaman berikutnya punya skeleton sendiri di ujung daftar;
    // meredupkan seluruh daftar karenanya terbaca seperti daftar diganti.
    isRefreshing: more.isFetching && !more.isFetchingNextPage,
    // Galat halaman ke-N tidak boleh menelan halaman yang sudah tampil —
    // ia dilaporkan di ujung daftar lewat `isLoadMoreError`.
    error: more.isFetchNextPageError ? null : more.error,
    onRetry: () => void more.refetch(),
    pagination: {
      mode: "more",
      hasMore: more.hasNextPage,
      isLoadingMore: more.isFetchingNextPage,
      isLoadMoreError: more.isFetchNextPageError,
      loadedPages: loaded?.length ?? 0,
      lastPageSize: loaded?.at(-1)?.data.length ?? 0,
      // `isFetching`: pengamat di ujung daftar bisa memanggil ini berulang,
      // dan `fetchNextPage` bawaan membatalkan-lalu-mengulang permintaan yang
      // sedang jalan alih-alih menunggunya.
      onLoadMore: () => {
        if (more.hasNextPage && !more.isFetching) void more.fetchNextPage();
      },
    } satisfies DataListPagination,
  };
}
