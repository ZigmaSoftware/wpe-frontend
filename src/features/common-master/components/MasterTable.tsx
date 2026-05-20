import type { ReactNode } from "react";
import DataTable from "@/components/erp/DataTable";

type Column<T> = {
  key: string;
  title: string;
  className?: string;
  render: (record: T) => ReactNode;
};

type MasterTableProps<T> = {
  columns: Array<Column<T>>;
  records: T[];
  isLoading: boolean;
  isError: boolean;
  errorDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRetry: () => void;
};

const MasterTable = <T,>(props: MasterTableProps<T>) => <DataTable {...props} />;

export default MasterTable;
