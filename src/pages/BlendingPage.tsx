import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { coreApi } from "@/lib/api";
import { formatDecimal, getApiErrorMessage } from "@/lib/api-helpers";
import type { DepartmentStock } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

const transferSchema = z.object({
  quantity: z.string().min(1, "Quantity is required."),
});

const BlendingPage = () => {
  const queryClient = useQueryClient();
  const [selectedStock, setSelectedStock] = useState<DepartmentStock | null>(null);
  const form = useForm<{ quantity: string }>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      quantity: "",
    },
  });

  const blendingQuery = useQuery({
    queryKey: ["blending-stock"],
    queryFn: async () => {
      const response = await coreApi.get<DepartmentStock[]>("/api/blending/stock/");
      return response.data;
    },
  });

  const requestStockMutation = useMutation({
    mutationFn: async (payload: { item_id: number; quantity: string }) => {
      const response = await coreApi.post("/api/blending/request-stock/", payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Stock transferred to blending department.");
      setSelectedStock(null);
      form.reset({ quantity: "" });
      queryClient.invalidateQueries({ queryKey: ["blending-stock"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to transfer stock. Insufficient stock may be available."));
    },
  });

  const totalQuantity = (blendingQuery.data ?? []).reduce((sum, stock) => sum + Number(stock.quantity), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blending Stock"
        description="Shows the blending department stock table and the live stock transfer modal."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Blending Rows" value={blendingQuery.data?.length ?? 0} />
        <StatCard label="Total Quantity" value={formatDecimal(totalQuantity)} />
        <StatCard label="Department" value="BLENDING" />
      </div>

      {blendingQuery.isLoading ? <LoadingState label="Loading blending stock..." /> : null}
      {blendingQuery.isError ? <ErrorState description="Blending stock could not be loaded from the backend." /> : null}

      {!blendingQuery.isLoading && !blendingQuery.isError ? (
        blendingQuery.data?.length ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blendingQuery.data.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-mono text-xs">{stock.item_code}</TableCell>
                    <TableCell>{stock.item_name}</TableCell>
                    <TableCell>{formatDecimal(stock.quantity)}</TableCell>
                    <TableCell>{stock.unit}</TableCell>
                    <TableCell>{stock.department}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" onClick={() => setSelectedStock(stock)}>
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Transfer More
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No blending stock yet" description="Request stock from the store through the transfer modal." />
        )
      ) : null}

      <Dialog open={Boolean(selectedStock)} onOpenChange={(open) => {
        if (!open) {
          setSelectedStock(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer stock to blending</DialogTitle>
            <DialogDescription>
              Uses `POST CORE/api/blending/request-stock/` with `item_id` and `quantity`.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                if (selectedStock) {
                  requestStockMutation.mutate({ item_id: selectedStock.item, quantity: values.quantity });
                }
              })}
              className="space-y-4"
            >
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <div className="font-medium">{selectedStock?.item_name}</div>
                <div className="text-muted-foreground">{selectedStock?.item_code}</div>
              </div>
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl><Input {...field} placeholder="0.000" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedStock(null)}>Cancel</Button>
                <Button type="submit" disabled={requestStockMutation.isPending}>Transfer</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlendingPage;
