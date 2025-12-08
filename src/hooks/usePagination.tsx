"use client";

import { useState } from "react";

export const useHooksPagination = () => {
  const [activePage, setActivePage] = useState<number>(1);
  const [limitPage, setLimitPage] = useState<number>(10);
  const [totalPage, setTotalPage] = useState<number>(0);
  const [totalData, setTotalData] = useState<number>(0);
  const [searchData, setSearchData] = useState<string>("");

  const resetPagination = () => {
    setActivePage(1);
    setSearchData("");
  };

  return {
    activePage,
    setActivePage,
    limitPage,
    setLimitPage,
    totalPage,
    setTotalPage,
    totalData,
    setTotalData,
    searchData,
    setSearchData,
    resetPagination,
  };
};
