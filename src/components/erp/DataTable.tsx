import type { ReactNode } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MasterPagination from "@/features/common-master/components/MasterPagination";

export type DataTableColumn<T> = {
  key: string;
  title: string;
  className?: string;
  render: (record: T) => ReactNode;
};

const DataTable = <T,>({
  columns,
  records,
  isLoading,
  isError,
  errorDescription,
  emptyTitle,
  emptyDescription,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRetry,
  recordKey,
}: {
  columns: Array<DataTableColumn<T>>;
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
  recordKey?: (record: T, index: number) => React.Key;
}) => {
  if (isLoading) {
    return <LoadingState label="Loading records..." />;
  }

  if (isError) {
    return <ErrorState description={errorDescription} action={<button onClick={onRetry}>Retry</button>} />;
  }

  if (!records.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">S.No</TableHead>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={recordKey ? recordKey(record, index) : index}>
              <TableCell className="text-center font-medium text-muted-foreground">
                {(page - 1) * pageSize + index + 1}
              </TableCell>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.render(record)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MasterPagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};

export default DataTable;
