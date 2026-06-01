import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageHeader from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { commonMasterApi } from "@/features/common-master/api/commonMasterApi";
import { commonMasterKeys } from "@/features/common-master/api/queryKeys";
import MasterStatusBadge from "@/features/common-master/components/MasterStatusBadge";
import MasterTable from "@/features/common-master/components/MasterTable";
import MasterToolbar from "@/features/common-master/components/MasterToolbar";
import RowActions from "@/features/common-master/components/RowActions";
import type { SupplierRecord } from "@/features/common-master/types";
import { useCommonMasterMutations } from "@/features/common-master/hooks/useCommonMasterMutations";
import { useCountryOptions, useCurrencyOptions } from "@/features/common-master/hooks/useLookupOptions";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { useTableSearchParams } from "@/features/common-master/hooks/useTableSearchParams";

const SuppliersPage = () => {
  const navigate = useNavigate();
  const table = useTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [searchParams, setSearchParams] = useSearchParams();
  const [toggleTarget, setToggleTarget] = useState<SupplierRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierRecord | null>(null);
  const gstStatusFilter = searchParams.get("gst_status") ?? "all";
  const countryFilter = searchParams.get("country") ?? "all";
  const currencyFilter = searchParams.get("currency") ?? "all";
  const countriesQuery = useCountryOptions();
  const currenciesQuery = useCurrencyOptions();

  const filterKey = useMemo(
    () => JSON.stringify({ gstStatusFilter, countryFilter, currencyFilter }),
    [countryFilter, currencyFilter, gstStatusFilter],
  );

  const suppliersQuery = useQuery({
    queryKey: commonMasterKeys.suppliers(table.page, table.pageSize, debouncedSearch, filterKey),
    queryFn: () =>
      commonMasterApi.listSuppliers({
        page: table.page,
        pageSize: table.pageSize,
        search: debouncedSearch,
        filters: {
          gst_status: gstStatusFilter === "all" ? undefined : gstStatusFilter,
          country: countryFilter === "all" ? undefined : Number(countryFilter),
          currency: currencyFilter === "all" ? undefined : Number(currencyFilter),
        },
      }),
  });

  const toggleMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.toggleSupplier,
    queryKey: ["common-masters", "suppliers"],
    successMessage: "Supplier status updated.",
    errorMessage: "Unable to update supplier status.",
  });
  const deleteMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.deleteSupplier,
    queryKey: ["common-masters", "suppliers"],
    successMessage: "Supplier deleted successfully.",
    errorMessage: "Unable to delete supplier.",
  });

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const result = suppliersQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Creations"
        description="Create and maintain supplier master records."
      />
      <MasterToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        createLabel="Add Supplier"
        onCreate={() => navigate("/masters/suppliers/new")}
        filters={
          <>
            <Select value={gstStatusFilter} onValueChange={(value) => setFilter("gst_status", value)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="GST status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All GST statuses</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="unregistered">Unregistered</SelectItem>
                <SelectItem value="provisional">Provisional</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={(value) => setFilter("country", value)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {(countriesQuery.data ?? []).map((country) => (
                  <SelectItem key={country.id} value={String(country.id)}>{country.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={currencyFilter} onValueChange={(value) => setFilter("currency", value)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Currency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All currencies</SelectItem>
                {(currenciesQuery.data ?? []).map((currency) => (
                  <SelectItem key={currency.id} value={String(currency.id)}>{currency.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />
      <MasterTable
        columns={[
          { key: "supplier_no", title: "Code", render: (record) => <span className="font-mono text-xs">{record.supplier_no}</span> },
          { key: "supplier_name", title: "Supplier", render: (record) => <div className="font-medium">{record.supplier_name}</div> },
          { key: "supplier_group", title: "Group", render: (record) => record.supplier_group || "-" },
          { key: "currency_name", title: "Currency", render: (record) => record.currency_code || record.currency_name || "-" },
          { key: "country_name", title: "Country", render: (record) => record.country_name || "-" },
          { key: "gst_status", title: "GST", render: (record) => record.gst_status },
          { key: "is_active", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[160px] text-right",
            render: (record) => (
              <RowActions
                onView={() => navigate(`/masters/suppliers/${record.id}`)}
                onToggle={() => setToggleTarget(record)}
                onDelete={() => setDeleteTarget(record)}
                isActive={record.is_active}
              />
            ),
          },
        ]}
        records={result?.items ?? []}
        isLoading={suppliersQuery.isLoading}
        isError={suppliersQuery.isError}
        errorDescription="Suppliers could not be loaded."
        emptyTitle="No suppliers found"
        emptyDescription="Create your first supplier to unlock procurement and partner setup flows."
        page={table.page}
        pageSize={table.pageSize}
        total={result?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => suppliersQuery.refetch()}
      />
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update supplier status"
        description={`Change the active status for ${toggleTarget?.supplier_name ?? "this supplier"}?`}
        onConfirm={() => {
          if (toggleTarget) {
            toggleMutation.mutate(toggleTarget.id);
            setToggleTarget(null);
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete supplier"
        description={`Delete ${deleteTarget?.supplier_name ?? "this supplier"}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};

export default SuppliersPage;
