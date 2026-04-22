import { useState } from "react";
import { Box, Plus, Search, Filter, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ModuleFormFieldsReference from "@/components/ModuleFormFieldsReference";

type ItemCategory = "raw_material" | "blend_item" | "consumable" | "accessory" | "general" | "scrap" | "maintenance" | "finished_good";

interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  hsn: string;
  unit: string;
  stock: number;
  reorderLevel: number;
  rate: number;
  gstPercent: number;
  status: "active" | "obsolete" | "discontinued";
}

const MOCK_ITEMS: Item[] = [
  { id: "RM-001", name: "HDPE Granules (Virgin)", category: "raw_material", hsn: "3901", unit: "KG", stock: 5200, reorderLevel: 1000, rate: 95.5, gstPercent: 18, status: "active" },
  { id: "RM-002", name: "LDPE Flakes", category: "raw_material", hsn: "3901", unit: "KG", stock: 3800, reorderLevel: 800, rate: 72.0, gstPercent: 18, status: "active" },
  { id: "RM-003", name: "PP Granules", category: "raw_material", hsn: "3902", unit: "KG", stock: 4100, reorderLevel: 900, rate: 88.0, gstPercent: 18, status: "active" },
  { id: "RM-004", name: "Carbon Black Masterbatch", category: "raw_material", hsn: "3206", unit: "KG", stock: 620, reorderLevel: 200, rate: 145.0, gstPercent: 18, status: "active" },
  { id: "RM-005", name: "UV Stabilizer", category: "raw_material", hsn: "3812", unit: "KG", stock: 180, reorderLevel: 50, rate: 320.0, gstPercent: 18, status: "active" },
  { id: "BL-001", name: "HSM 500 WPE Blend", category: "blend_item", hsn: "3901", unit: "KG", stock: 1200, reorderLevel: 300, rate: 110.0, gstPercent: 18, status: "active" },
  { id: "BL-002", name: "Standard WPE Mix", category: "blend_item", hsn: "3901", unit: "KG", stock: 900, reorderLevel: 200, rate: 98.0, gstPercent: 18, status: "active" },
  { id: "BL-003", name: "Premium HDPE Blend", category: "blend_item", hsn: "3901", unit: "KG", stock: 650, reorderLevel: 150, rate: 125.0, gstPercent: 18, status: "active" },
  { id: "CN-001", name: "Packing Tape (48mm)", category: "consumable", hsn: "3919", unit: "ROLL", stock: 450, reorderLevel: 100, rate: 35.0, gstPercent: 18, status: "active" },
  { id: "CN-002", name: "Stretch Wrap Film", category: "consumable", hsn: "3920", unit: "ROLL", stock: 120, reorderLevel: 30, rate: 280.0, gstPercent: 18, status: "active" },
  { id: "CN-003", name: "PP Bags (25 KG)", category: "consumable", hsn: "6305", unit: "PCS", stock: 8500, reorderLevel: 2000, rate: 12.0, gstPercent: 18, status: "active" },
  { id: "AC-001", name: "Extruder Die (60mm)", category: "accessory", hsn: "8477", unit: "PCS", stock: 3, reorderLevel: 1, rate: 45000.0, gstPercent: 18, status: "active" },
  { id: "SC-001", name: "WPE Scrap (Regrind)", category: "scrap", hsn: "3915", unit: "KG", stock: 2200, reorderLevel: 0, rate: 32.0, gstPercent: 18, status: "active" },
  { id: "MT-001", name: "Extruder Screw (Replacement)", category: "maintenance", hsn: "8477", unit: "PCS", stock: 2, reorderLevel: 1, rate: 85000.0, gstPercent: 18, status: "active" },
  { id: "FG-001", name: "WPE Pipe 110mm Class 6", category: "finished_good", hsn: "3917", unit: "MTR", stock: 15000, reorderLevel: 3000, rate: 185.0, gstPercent: 18, status: "active" },
  { id: "FG-002", name: "WPE Pipe 75mm Class 4", category: "finished_good", hsn: "3917", unit: "MTR", stock: 22000, reorderLevel: 5000, rate: 95.0, gstPercent: 18, status: "active" },
];

const categoryLabels: Record<ItemCategory, string> = {
  raw_material: "Raw Material", blend_item: "Blend Item", consumable: "Consumable", accessory: "Accessory",
  general: "General", scrap: "Scrap", maintenance: "Maintenance", finished_good: "Finished Good",
};

const ItemsPage = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filtered = MOCK_ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" || item.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Items</h1>
            <p className="text-sm text-muted-foreground">Raw materials, blends, consumables & finished goods</p>
          </div>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add Item</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[
          { label: "Raw Materials", count: MOCK_ITEMS.filter(i => i.category === "raw_material").length },
          { label: "Blend Items", count: MOCK_ITEMS.filter(i => i.category === "blend_item").length },
          { label: "Consumables", count: MOCK_ITEMS.filter(i => i.category === "consumable").length },
          { label: "Finished Goods", count: MOCK_ITEMS.filter(i => i.category === "finished_good").length },
          { label: "Total Items", count: MOCK_ITEMS.length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{s.count}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" className="gap-1"><Filter className="h-3.5 w-3.5" /> Filter</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="raw_material">Raw Materials</TabsTrigger>
          <TabsTrigger value="blend_item">Blend Items</TabsTrigger>
          <TabsTrigger value="consumable">Consumables</TabsTrigger>
          <TabsTrigger value="accessory">Accessories</TabsTrigger>
          <TabsTrigger value="scrap">Scrap</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="finished_good">Finished Goods</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>HSN</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Rate (₹)</TableHead>
                    <TableHead>GST %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">{item.id}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{categoryLabels[item.category]}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{item.hsn}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className={`text-right font-medium ${item.stock <= item.reorderLevel ? "text-destructive" : ""}`}>
                        {item.stock.toLocaleString()}
                        {item.stock <= item.reorderLevel && <span className="text-xs ml-1">⚠</span>}
                      </TableCell>
                      <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                      <TableCell>{item.gstPercent}%</TableCell>
                      <TableCell><Badge variant="outline" className={item.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>{item.status}</Badge></TableCell>
                    </TableRow>
                  ))}
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
