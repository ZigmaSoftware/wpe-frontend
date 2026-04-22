import { useState } from "react";
import { Users, Plus, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ModuleFormFieldsReference from "@/components/ModuleFormFieldsReference";

type ContactType = "customer" | "supplier" | "dealer" | "distributor" | "lead" | "prospect" | "shipper" | "service_provider";

interface Contact {
  id: string;
  name: string;
  type: ContactType;
  company: string;
  email: string;
  phone: string;
  city: string;
  gst: string;
  status: "active" | "inactive" | "pending";
  lastActivity: string;
}

const MOCK_CONTACTS: Contact[] = [
  { id: "C-001", name: "Rajesh Kumar", type: "customer", company: "ABC Plastics Pvt Ltd", email: "rajesh@abcplastics.in", phone: "+91 98765 43210", city: "Mumbai", gst: "27AABCA1234A1ZP", status: "active", lastActivity: "2026-04-08" },
  { id: "C-002", name: "Meena Patel", type: "customer", company: "XYZ Polymers Ltd", email: "meena@xyzpoly.com", phone: "+91 87654 32100", city: "Ahmedabad", gst: "24AABCX5678B1ZQ", status: "active", lastActivity: "2026-04-07" },
  { id: "S-001", name: "Vikram Singh", type: "supplier", company: "Raw Material Suppliers Co", email: "vikram@rmsco.in", phone: "+91 76543 21098", city: "Delhi", gst: "07AABCR9012C1ZR", status: "active", lastActivity: "2026-04-09" },
  { id: "S-002", name: "Anitha Rao", type: "supplier", company: "Chemical Traders", email: "anitha@chemtrade.com", phone: "+91 65432 10987", city: "Chennai", gst: "33AABCC3456D1ZS", status: "active", lastActivity: "2026-04-06" },
  { id: "D-001", name: "Suresh Jain", type: "dealer", company: "National Distributors", email: "suresh@natdist.in", phone: "+91 54321 09876", city: "Jaipur", gst: "08AABCN7890E1ZT", status: "active", lastActivity: "2026-04-05" },
  { id: "L-001", name: "Priya Sharma", type: "lead", company: "Green Packaging Co", email: "priya@greenpkg.com", phone: "+91 43210 98765", city: "Pune", gst: "-", status: "pending", lastActivity: "2026-04-09" },
  { id: "L-002", name: "Amit Desai", type: "lead", company: "Metro Plastics", email: "amit@metroplast.in", phone: "+91 32109 87654", city: "Bangalore", gst: "-", status: "pending", lastActivity: "2026-04-08" },
  { id: "P-001", name: "Kavitha Nair", type: "prospect", company: "Southern Polymers", email: "kavitha@southpoly.com", phone: "+91 21098 76543", city: "Kochi", gst: "32AABCS1234F1ZU", status: "active", lastActivity: "2026-04-04" },
  { id: "DT-001", name: "Raman Iyer", type: "distributor", company: "Pan India Distribution", email: "raman@panindiadist.com", phone: "+91 10987 65432", city: "Hyderabad", gst: "36AABCP5678G1ZV", status: "active", lastActivity: "2026-04-03" },
  { id: "SH-001", name: "TransCargo Logistics", type: "shipper", company: "TransCargo Logistics Pvt Ltd", email: "ops@transcargo.in", phone: "+91 99887 76655", city: "Mumbai", gst: "27AABCT9012H1ZW", status: "active", lastActivity: "2026-04-09" },
  { id: "SP-001", name: "TechServe India", type: "service_provider", company: "TechServe India Ltd", email: "support@techserve.in", phone: "+91 88776 65544", city: "Noida", gst: "09AABCT3456I1ZX", status: "active", lastActivity: "2026-04-07" },
];

const typeLabels: Record<ContactType, string> = {
  customer: "Customer", supplier: "Supplier", dealer: "Dealer", distributor: "Distributor",
  lead: "Lead", prospect: "Prospect", shipper: "Shipper", service_provider: "Service Provider",
};

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-warning/10 text-warning border-warning/20",
};

const ContactsPage = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filtered = MOCK_CONTACTS.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" || c.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const counts = MOCK_CONTACTS.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
            <p className="text-sm text-muted-foreground">Manage customers, suppliers, dealers & leads</p>
          </div>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add Contact</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Customers", count: counts.customer || 0, color: "text-primary" },
          { label: "Suppliers", count: counts.supplier || 0, color: "text-accent-foreground" },
          { label: "Dealers", count: counts.dealer || 0, color: "text-muted-foreground" },
          { label: "Leads", count: counts.lead || 0, color: "text-warning" },
          { label: "Prospects", count: counts.prospect || 0, color: "text-secondary-foreground" },
          { label: "Total", count: MOCK_CONTACTS.length, color: "text-foreground" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or company..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" className="gap-1"><Filter className="h-3.5 w-3.5" /> Filter</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All ({MOCK_CONTACTS.length})</TabsTrigger>
          <TabsTrigger value="customer">Customers</TabsTrigger>
          <TabsTrigger value="supplier">Suppliers</TabsTrigger>
          <TabsTrigger value="dealer">Dealers</TabsTrigger>
          <TabsTrigger value="distributor">Distributors</TabsTrigger>
          <TabsTrigger value="lead">Leads</TabsTrigger>
          <TabsTrigger value="prospect">Prospects</TabsTrigger>
          <TabsTrigger value="shipper">Shippers</TabsTrigger>
          <TabsTrigger value="service_provider">Service Providers</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.company}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{typeLabels[c.type]}</Badge></TableCell>
                      <TableCell>{c.city}</TableCell>
                      <TableCell className="text-xs">{c.phone}</TableCell>
                      <TableCell className="font-mono text-xs">{c.gst}</TableCell>
                      <TableCell><Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.lastActivity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No contacts found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ModuleFormFieldsReference moduleId="contact" />
    </div>
  );
};

export default ContactsPage;
