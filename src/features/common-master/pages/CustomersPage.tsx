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
import type { CustomerRecord } from "@/features/common-master/types";
import { useCommonMasterMutations } from "@/features/common-master/hooks/useCommonMasterMutations";
import { useCountryOptions, useCurrencyOptions } from "@/features/common-master/hooks/useLookupOptions";
import { useDebouncedValue } from "@/features/common-master/hooks/useDebouncedValue";
import { useTableSearchParams } from "@/features/common-master/hooks/useTableSearchParams";

const CustomersPage = () => {
  const navigate = useNavigate();
  const table = useTableSearchParams();
  const debouncedSearch = useDebouncedValue(table.search);
  const [searchParams, setSearchParams] = useSearchParams();
  const [toggleTarget, setToggleTarget] = useState<CustomerRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);
  const statusFilter = searchParams.get("customer_status") ?? "all";
  const countryFilter = searchParams.get("country") ?? "all";
  const currencyFilter = searchParams.get("currency") ?? "all";
  const countriesQuery = useCountryOptions();
  const currenciesQuery = useCurrencyOptions();

  const filterKey = useMemo(
    () => JSON.stringify({ statusFilter, countryFilter, currencyFilter }),
    [countryFilter, currencyFilter, statusFilter],
  );

  const customersQuery = useQuery({
    queryKey: commonMasterKeys.customers(table.page, table.pageSize, debouncedSearch, filterKey),
    queryFn: () =>
      commonMasterApi.listCustomers({
        page: table.page,
        pageSize: table.pageSize,
        search: debouncedSearch,
        filters: {
          customer_status: statusFilter === "all" ? undefined : statusFilter,
          country: countryFilter === "all" ? undefined : Number(countryFilter),
          currency: currencyFilter === "all" ? undefined : Number(currencyFilter),
        },
      }),
  });

  const toggleMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.toggleCustomer,
    queryKey: ["common-masters", "customers"],
    successMessage: "Customer status updated.",
    errorMessage: "Unable to update customer status.",
  });
  const deleteMutation = useCommonMasterMutations({
    mutationFn: commonMasterApi.deleteCustomer,
    queryKey: ["common-masters", "customers"],
    successMessage: "Customer deleted successfully.",
    errorMessage: "Unable to delete customer.",
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

  const result = customersQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Maintain customer commercial profiles with geography, statutory, banking, and document setup."
      />
      <MasterToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        createLabel="Add Customer"
        onCreate={() => navigate("/masters/customers/new")}
        filters={
          <>
            <Select value={statusFilter} onValueChange={(value) => setFilter("customer_status", value)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
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
          { key: "customer_no", title: "Code", render: (record) => <span className="font-mono text-xs">{record.customer_no}</span> },
          { key: "customer_name", title: "Customer", render: (record) => <div className="font-medium">{record.customer_name}</div> },
          { key: "customer_group", title: "Group", render: (record) => record.customer_group },
          { key: "currency_name", title: "Currency", render: (record) => record.currency_code || record.currency_name || "-" },
          { key: "country_name", title: "Country", render: (record) => record.country_name || "-" },
          { key: "mobile_no", title: "Mobile", render: (record) => record.mobile_no || "-" },
          { key: "customer_status", title: "Status", render: (record) => <MasterStatusBadge active={record.is_active} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[160px] text-right",
            render: (record) => (
              <RowActions
                onView={() => navigate(`/masters/customers/${record.id}`)}
                onToggle={() => setToggleTarget(record)}
                onDelete={() => setDeleteTarget(record)}
              />
            ),
          },
        ]}
        records={result?.items ?? []}
        isLoading={customersQuery.isLoading}
        isError={customersQuery.isError}
        errorDescription="Customers could not be loaded."
        emptyTitle="No customers found"
        emptyDescription="Create your first customer profile to start downstream commercial workflows."
        page={table.page}
        pageSize={table.pageSize}
        total={result?.filtered ?? 0}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onRetry={() => customersQuery.refetch()}
      />
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Update customer status"
        description={`Change the active status for ${toggleTarget?.customer_name ?? "this customer"}?`}
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
        title="Delete customer"
        description={`Delete ${deleteTarget?.customer_name ?? "this customer"}? This action cannot be undone.`}
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

export default CustomersPage;
