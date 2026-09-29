"use client";

import { DataList } from "@/components/common/list";

import { useAccountChildren } from "../api";
import { AccountListItemRow, accountTable } from "../list/list-item";
import { accountRows } from "../model";
import type { Account } from "../types";

interface PropTypes {
  account: Account;
}

export const ChildList = (props: PropTypes) => {
  const { account } = props;

  const children = useAccountChildren(
    account.childCount > 0 ? account.id : undefined,
  );

  return (
    <section aria-labelledby="child-list" className="pt-6">
      <h2 id="child-list" className="px-gutter pb-3 text-title font-semibold">
        Sub akun
      </h2>

      {account.childCount === 0 ? (
        <p className="text-muted-foreground px-gutter text-body">
          Akun ini belum punya sub akun.
        </p>
      ) : (
        <DataList
          items={
            children.data === undefined
              ? undefined
              : accountRows(children.data, true)
          }
          getKey={(child) => child.code}
          label={`Sub akun ${account.code}`}
          isLoading={children.isPending}
          isRefreshing={children.isFetching}
          error={children.error}
          onRetry={() => void children.refetch()}
          emptyTitle="Belum ada sub akun"
          table={accountTable()}
          itemNoun="akun"
        >
          {(child) => (
            <AccountListItemRow account={child} isCanUpdate={false} />
          )}
        </DataList>
      )}
    </section>
  );
};
