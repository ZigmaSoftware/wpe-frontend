import { useDeferredValue, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Box, FileSpreadsheet, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import ModuleFormFieldsReference from "@/components/ModuleFormFieldsReference";

const ITEMS_API_URL = import.meta.env.VITE_ITEMS_API_URL ?? "/api/items/";
const ITEMS_IMPORT_API_URL = import.meta.env.VITE_ITEMS_IMPORT_API_URL ?? "/api/items/import/";
const ITEM_IMPORT_SAMPLE_URL = "/item-import-sample.xlsx";

interface ItemImportError {
  row: number;
  message: string;
  details?: Record<string, unknown>;
}

interface ItemImportResponse {
  created_count: number;
  failed_count: number;
  processed_count: number;
  errors: ItemImportError[];
  detail?: string;
}

interface ItemRecord {
  id: number;
  category: string;
  group: string;
  sub_group: string;
  item_name: string;
  item_code: string;
  hsn_code: string | null;
  unit: string;
  product_details: string | null;
  description: string | null;
  min_max_status: boolean;
  status: boolean;
  created_at: string;
  updated_at: string;
}

const formatLabel = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const fetchItems = async (): Promise<ItemRecord[]> => {
  const response = await fetch(ITEMS_API_URL, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Items request failed with ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  throw new Error("Unexpected items response received from the backend.");
};

const ItemsPage = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const { data: items = [], error, isError, isFetching, isLoading, refetch } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
    staleTime: 30_000,
  });

  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort((left, right) =>
    formatLabel(left).localeCompare(formatLabel(right)),
  );
  const groups = Array.from(new Set(items.map((item) => item.group).filter(Boolean))).sort((left, right) =>
    formatLabel(left).localeCompare(formatLabel(right)),
  );

  const selectedTab = activeTab === "all" || categories.includes(activeTab) ? activeTab : "all";
  const selectedGroupValue = selectedGroup === "all" || groups.includes(selectedGroup) ? selectedGroup : "all";

  const filtered = items.filter((item) => {
    const haystack = [item.item_name, item.item_code, item.category, item.group, item.sub_group, item.hsn_code ?? ""]
      .join(" ")
      .toLowerCase();
    const matchesSearch = deferredSearch.length === 0 || haystack.includes(deferredSearch);
    const matchesTab = selectedTab === "all" || item.category === selectedTab;
    const matchesGroup = selectedGroupValue === "all" || item.group === selectedGroupValue;
    return matchesSearch && matchesTab && matchesGroup;
  });

  const stats = [
    { label: "Active Items", count: items.filter((item) => item.status).length },
    { label: "Categories", count: categories.length },
    { label: "Groups", count: groups.length },
    { label: "Min/Max Enabled", count: items.filter((item) => item.min_max_status).length },
    { label: "Total Items", count: items.length },
  ];

  const openImportDialog = () => {
    fileInputRef.current?.click();
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Please upload a .xlsx Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsImporting(true);
    try {
      const response = await fetch(ITEMS_IMPORT_API_URL, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let payload: Partial<ItemImportResponse> = {};

      if (responseText.length > 0) {
        try {
          payload = JSON.parse(responseText) as ItemImportResponse;
        } catch {
          payload = { detail: responseText };
        }
      }

      if (!response.ok) {
        const firstError = Array.isArray(payload.errors) ? payload.errors[0] : undefined;
        const errorMessage = payload.detail
          ?? (firstError ? `Row ${firstError.row}: ${firstError.message}` : undefined)
          ?? "The Excel file could not be imported.";
        throw new Error(errorMessage);
      }

      await refetch();

      const createdCount = payload.created_count ?? 0;
      const failedCount = payload.failed_count ?? 0;
      const firstError = Array.isArray(payload.errors) ? payload.errors[0] : undefined;

      if (failedCount > 0) {
        toast(`Imported ${createdCount} item${createdCount === 1 ? "" : "s"} with ${failedCount} skipped row${failedCount === 1 ? "" : "s"}.`, {
          description: firstError ? `Row ${firstError.row}: ${firstError.message}` : "Review the backend response for row-level details.",
        });
      } else {
        toast.success(`Imported ${createdCount} item${createdCount === 1 ? "" : "s"} from Excel.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The Excel import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2">
          <Box className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Items</h1>
            <p className="text-sm text-muted-foreground">Raw materials, blends, consumables & finished goods</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleExcelImport} />
            <Button variant="outline" className="gap-2" onClick={openImportDialog} disabled={isImporting}>
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              {isImporting ? "Importing..." : "Import Excel"}
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>
          <p className="max-w-md text-xs text-muted-foreground sm:text-right">
            Upload the sample Excel format and it will create item records in the backend database.{" "}
            <a href={ITEM_IMPORT_SAMPLE_URL} download className="font-medium text-primary underline-offset-4 hover:underline">
              Download the sample file
            </a>
            .
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{stat.count}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:ml-auto lg:flex-row lg:items-center lg:justify-end">
        <Select value={selectedGroupValue} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group} value={group}>
                {formatLabel(group)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative w-full sm:w-[22rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="outline" size="sm" className="gap-1" onClick={() => void refetch()}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load items</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "The frontend could not reach the items API."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {formatLabel(category)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">S.No</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Sub Group</TableHead>
                    <TableHead>HSN</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Min/Max</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                      </TableRow>
                    ))}

                  {!isLoading &&
                    filtered.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{item.item_code}</TableCell>
                        <TableCell>
                          <div className="font-medium">{item.item_name}</div>
                          {item.description && (
                            <div className="max-w-[20rem] truncate text-xs text-muted-foreground">{item.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {formatLabel(item.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.group || "-"}</TableCell>
                        <TableCell>{item.sub_group || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{item.hsn_code || "-"}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={item.min_max_status ? "bg-primary/10 text-primary" : "text-muted-foreground"}>
                            {item.min_max_status ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={item.status ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
                            {item.status ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}

                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                        {items.length === 0 ? "No items found in the backend yet." : "No items match the current search or group filter."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ModuleFormFieldsReference moduleId="item" />
    </div>
  );
};

export default ItemsPage;
