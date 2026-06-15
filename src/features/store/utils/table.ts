import type { StorePageSizeValue } from "@/features/store/components/StoreTableToolbar";

export const getPageSizeNumber = (pageSize: StorePageSizeValue, total: number) =>
  pageSize === "all" ? Math.max(total, 1) : Number(pageSize);

export const getPageCount = (pageSize: StorePageSizeValue, total: number) =>
  Math.max(1, Math.ceil(total / getPageSizeNumber(pageSize, total)));

export const paginateRows = <T,>(rows: T[], page: number, pageSize: StorePageSizeValue) => {
  if (pageSize === "all") {
    return rows;
  }

  const pageLength = Number(pageSize);
  const start = (page - 1) * pageLength;
  return rows.slice(start, start + pageLength);
};

export const getPageSerialNumber = (
  page: number,
  pageSize: StorePageSizeValue,
  total: number,
  rowIndex: number,
) => (page - 1) * getPageSizeNumber(pageSize, total) + rowIndex + 1;
