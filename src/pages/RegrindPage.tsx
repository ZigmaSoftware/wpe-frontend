import { useQuery } from "@tanstack/react-query";
import { CalendarDays, History, PackageSearch, Search } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { coreApi } from "@/lib/api";
import { formatDateTime, normalizeListResponse } from "@/lib/api-helpers";
import type { RegrindEntry } from "@/lib/types";

// ── Stage badge ───────────────────────────────────────────────────────────────

const STAGE_CLASSES: Record<string, string> = {
  AD: "bg-slate-100 text-slate-700",
  BL: "bg-blue-100 text-blue-700",
  GL: "bg-green-100 text-green-700",
};

const StageBadge = ({ stage }: { stage: string }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_CLASSES[stage] ?? "bg-gray-100 text-gray-700"}`}>
    {stage}
  </span>
);

// ── Summary card ──────────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="rounded-xl border bg-card p-4 space-y-1">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const RegrindPage = () => {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [validFilter, setValidFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const buildParams = () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", "25");
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    return params.toString();
  };

  const historyQ = useQuery({
    queryKey: ["regrind-history", page, dateFrom, dateTo],
    queryFn: async () => {
      const res = await coreApi.get<unknown>(
        `/api/production/regrind/history/?${buildParams()}`
      );
      const p = res.data as {
        data?: { count: number; results: RegrindEntry[] };
        results?: RegrindEntry[];
        count?: number;
      };
      const results = normalizeListResponse<RegrindEntry>(res.data);
      const count = p.data?.count ?? p.count ?? results.length;
      return { results, count };
    },
  });

  const entries = historyQ.data?.results ?? [];
  const totalCount = historyQ.data?.count ?? 0;

  // Client-side filter for search + stage + valid
  const filtered = entries.filter((e) => {
    if (stageFilter !== "all" && e.stage !== stageFilter) return false;
    if (validFilter === "valid" && !e.is_valid) return false;
    if (validFilter === "invalid" && e.is_valid) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return [
        e.item_name,
        e.item_code,
        e.source_lot_no ?? "",
        e.added_by_username ?? "",
      ].join(" ").toLowerCase().includes(q);
    }
    return true;
  });

  // Summary stats from fetched page
  const totalGrams = entries.reduce((sum, e) => sum + Number(e.quantity_grams), 0);
  const validCount = entries.filter((e) => e.is_valid).length;
  const stageBreakdown = ["AD", "BL", "GL"].map((s) => ({
    stage: s,
    grams: entries.filter((e) => e.stage === s).reduce((sum, e) => sum + Number(e.quantity_grams), 0),
    count: entries.filter((e) => e.stage === s).length,
  }));

  const totalPages = Math.ceil(totalCount / 25);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regrind Material History"
        description="Full audit trail of all regrind material (LDPE/HDPE) usage across production orders and batches."
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Entries (page)"
          value={entries.length}
          sub={`${totalCount} total records`}
        />
        <SummaryCard
          label="Total Weight (page)"
          value={`${(totalGrams / 1000).toFixed(3)} kg`}
          sub={`${totalGrams.toFixed(1)} g`}
        />
        <SummaryCard
          label="Valid Entries"
          value={validCount}
          sub={`${entries.length - validCount} invalid`}
        />
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-xs text-muted-foreground">By Stage</p>
          {stageBreakdown.map((s) => (
            <div key={s.stage} className="flex items-center justify-between text-sm">
              <StageBadge stage={s.stage} />
              <span className="text-muted-foreground text-xs">
                {s.count} entries · {(s.grams / 1000).toFixed(2)} kg
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item, code, lot..."
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="AD">AD</SelectItem>
            <SelectItem value="BL">BL</SelectItem>
            <SelectItem value="GL">GL</SelectItem>
          </SelectContent>
        </Select>
        <Select value={validFilter} onValueChange={(v) => { setValidFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Validity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entries</SelectItem>
            <SelectItem value="valid">Valid only</SelectItem>
            <SelectItem value="invalid">Invalid only</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-40 text-sm"
            placeholder="From"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-40 text-sm"
            placeholder="To"
          />
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
              className="text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {historyQ.isLoading && <LoadingState label="Loading regrind history..." />}
      {historyQ.isError && <ErrorState description="Could not load regrind history." />}

      {!historyQ.isLoading && !historyQ.isError && (
        filtered.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Qty (g)</TableHead>
                    <TableHead className="text-right">Qty (kg)</TableHead>
                    <TableHead>Lot No</TableHead>
                    <TableHead>Valid</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Added At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry, i) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-center text-muted-foreground">
                        {(page - 1) * 25 + i + 1}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{entry.item_name}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.item_code}</TableCell>
                      <TableCell><StageBadge stage={entry.stage} /></TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {Number(entry.quantity_grams).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {(Number(entry.quantity_grams) / 1000).toFixed(3)}
                      </TableCell>
                      <TableCell className="text-xs">{entry.source_lot_no || "—"}</TableCell>
                      <TableCell>
                        {entry.is_valid ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">Valid</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 text-xs" title={entry.validation_notes}>
                            Invalid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.added_by_username ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(entry.added_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>
                  Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, totalCount)} of {totalCount} entries
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span>Page {page} of {totalPages}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="No regrind entries found"
            description={
              search || stageFilter !== "all" || validFilter !== "all" || dateFrom || dateTo
                ? "Try adjusting your filters."
                : "Regrind material usage will appear here once operators record entries during production batches."
            }
            action={
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <History className="h-4 w-4" />
                <p className="text-xs">Entries are added from the Production module during BL and GL batch stages.</p>
              </div>
            }
          />
        )
      )}
    </div>
  );
};

export default RegrindPage;
