import { useState } from "react";
import { ShoppingCart, Search, TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ModuleFormFieldsReference from "@/components/ModuleFormFieldsReference";

type OrderStatus = "open" | "despatch_ready" | "shipped" | "delivered" | "material_out" | "cancelled" | "return";

interface SalesOrder {
  id: string;
  invoiceNo: string;
  customer: string;
  items: number;
  amount: number;
  status: OrderStatus;
  date: string;
  dcNo: string;
  vehicle: string;
  destination: string;
}

const MOCK_ORDERS: SalesOrder[] = [
  { id: "SO-4521", invoiceNo: "ZG/INV/26-27/4521", customer: "ABC Plastics Pvt Ltd", items: 5, amount: 425000, status: "open", date: "2026-04-09", dcNo: "-", vehicle: "-", destination: "Mumbai" },
  { id: "SO-4520", invoiceNo: "ZG/INV/26-27/4520", customer: "Metro Infrastructure", items: 12, amount: 1850000, status: "despatch_ready", date: "2026-04-08", dcNo: "DC-3301", vehicle: "MH-04-AB-1234", destination: "Pune" },
  { id: "SO-4519", invoiceNo: "ZG/INV/26-27/4519", customer: "XYZ Polymers Ltd", items: 6, amount: 520000, status: "shipped", date: "2026-04-07", dcNo: "DC-3300", vehicle: "GJ-01-CD-5678", destination: "Ahmedabad" },
  { id: "SO-4518", invoiceNo: "ZG/INV/26-27/4518", customer: "National Distributors", items: 15, amount: 2100000, status: "delivered", date: "2026-04-06", dcNo: "DC-3299", vehicle: "RJ-14-EF-9012", destination: "Jaipur" },
  { id: "SO-4517", invoiceNo: "ZG/INV/26-27/4517", customer: "Southern Polymers", items: 8, amount: 680000, status: "material_out", date: "2026-04-05", dcNo: "DC-3298", vehicle: "KL-01-GH-3456", destination: "Kochi" },
  { id: "SO-4516", invoiceNo: "ZG/INV/26-27/4516", customer: "Green Infra Ltd", items: 3, amount: 290000, status: "delivered", date: "2026-04-04", dcNo: "DC-3297", vehicle: "TN-09-IJ-7890", destination: "Chennai" },
  { id: "SO-4515", invoiceNo: "ZG/INV/26-27/4515", customer: "BuildMax Corp", items: 9, amount: 890000, status: "cancelled", date: "2026-04-03", dcNo: "-", vehicle: "-", destination: "Hyderabad" },
  { id: "SO-4514", invoiceNo: "ZG/INV/26-27/4514", customer: "Pan India Distribution", items: 20, amount: 3200000, status: "shipped", date: "2026-04-02", dcNo: "DC-3296", vehicle: "AP-28-KL-1234", destination: "Vizag" },
  { id: "SO-4513", invoiceNo: "ZG/INV/26-27/4513", customer: "Kavitha Enterprises", items: 4, amount: 175000, status: "return", date: "2026-04-01", dcNo: "DC-3295", vehicle: "-", destination: "Bangalore" },
];

const statusLabels: Record<OrderStatus, string> = {
  open: "Open", despatch_ready: "Despatch Ready", shipped: "Shipped", delivered: "Delivered",
  material_out: "Material Out", cancelled: "Cancelled", return: "Return",
};
const statusColors: Record<OrderStatus, string> = {
  open: "bg-warning/10 text-warning", despatch_ready: "bg-primary/10 text-primary", shipped: "bg-accent/20 text-accent-foreground",
  delivered: "bg-success/10 text-success", material_out: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive", return: "bg-destructive/10 text-destructive",
};

const SalesOutwardsPage = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filtered = MOCK_ORDERS.filter((o) => {
    const matchesSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.invoiceNo.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" || o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales & Outwards</h1>
          <p className="text-sm text-muted-foreground">Orders, dispatch, delivery & returns tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Open Orders", count: MOCK_ORDERS.filter(o => o.status === "open").length, color: "text-warning" },
          { label: "Despatch Ready", count: MOCK_ORDERS.filter(o => o.status === "despatch_ready").length, color: "text-primary" },
          { label: "Shipped", count: MOCK_ORDERS.filter(o => o.status === "shipped").length, color: "text-accent-foreground" },
          { label: "Delivered", count: MOCK_ORDERS.filter(o => o.status === "delivered").length, color: "text-success" },
          { label: "Returns", count: MOCK_ORDERS.filter(o => o.status === "return").length, color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.count}</div><div className="text-xs text-muted-foreground">{s.label}</div></CardContent></Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="despatch_ready">Despatch Ready</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="material_out">Material Out</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="return">Returns</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead><TableHead>DC No</TableHead>
                <TableHead>Vehicle</TableHead><TableHead>Destination</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{o.invoiceNo}</TableCell>
                    <TableCell className="font-medium">{o.customer}</TableCell>
                    <TableCell>{o.items}</TableCell>
                    <TableCell className="text-right font-medium">₹{o.amount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{o.dcNo}</TableCell>
                    <TableCell className="text-xs">{o.vehicle}</TableCell>
                    <TableCell>{o.destination}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-xs ${statusColors[o.status]}`}>{statusLabels[o.status]}</Badge></TableCell>
                    <TableCell className="text-xs">{o.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <ModuleFormFieldsReference moduleId="ordersaledoc" />
    </div>
  );
};

export default SalesOutwardsPage;
