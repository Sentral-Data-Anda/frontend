"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  type QueryKey,
} from "@tanstack/react-query";

import type { DataListPagination } from "@/components/common/list";
import { toApiQuery, type ListState } from "@/hooks/use-list-params";
import { useIsDesktop } from "@/hooks/use-media";
import type { ApiListResponse } from "@/types/api";

export const getNextPageParam = (
  lastPage: Pick<ApiListResponse<unknown>, "totalPage">,
  _allPages: unknown,
  lastPageParam: number,
): number | undefined =>
  lastPageParam < lastPage.totalPage ? lastPageParam + 1 : undefined;

const LIST_GC_TIME = 15 * 60 * 1000;

export function useListQuery<T>({
  queryKey,
  fetchPage,
  params,
  refetchInterval,
}: {
  queryKey: QueryKey;
  fetchPage: (apiQuery: string) => Promise<ApiListResponse<T>>;
  params: ListState;
  refetchInterval?: number;
}) {
  const isDesktop = useIsDesktop();
  const pageQuery = toApiQuery(params);
  const firstPageQuery = toApiQuery({ ...params, page: 1 });

  const pages = useQuery({
    queryKey: [...queryKey, pageQuery],
    queryFn: () => fetchPage(pageQuery),
    placeholderData: keepPreviousData,
    gcTime: LIST_GC_TIME,
    refetchInterval,
    enabled: isDesktop === true,
  });

  const more = useInfiniteQuery({
    queryKey: [...queryKey, "infinite", firstPageQuery],
    queryFn: ({ pageParam }) =>
      fetchPage(toApiQuery({ ...params, page: pageParam })),
    initialPageParam: 1,
    getNextPageParam,
    placeholderData: keepPreviousData,
    gcTime: LIST_GC_TIME,
    refetchInterval,
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
        totalData: pages.data?.totalData,
        limit: params.limit,
        onPickLimit: params.onPickLimit,
      } satisfies DataListPagination,
    };
  }

  const loaded = more.data?.pages;

  return {
    items: loaded?.flatMap((page) => page.data),
    totalData: loaded?.[0]?.totalData,
    isLoading: more.isPending,
    isRefreshing: more.isFetching && !more.isFetchingNextPage,
    error: more.isFetchNextPageError ? null : more.error,
    onRetry: () => void more.refetch(),
    pagination: {
      mode: "more",
      isMoreAvailable: more.hasNextPage,
      isLoadingMore: more.isFetchingNextPage,
      isLoadMoreError: more.isFetchNextPageError,
      isBusy: more.isFetching,
      totalData: loaded?.[0]?.totalData ?? 0,
      onLoadMore: () => {
        if (more.hasNextPage && !more.isFetching) void more.fetchNextPage();
      },
    } satisfies DataListPagination,
  };
}
