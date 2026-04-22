import { useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ModuleFormFieldsReference from "@/components/ModuleFormFieldsReference";

type PIStatus = "pending" | "confirmed" | "partially_reserved" | "fully_reserved" | "ready_for_dispatch" | "dispatch_in_progress" | "cancelled" | "lost" | "closed_won";

interface ProformaInvoice {
  id: string;
  ref: string;
  customer: string;
  project: string;
  items: number;
  amount: number;
  status: PIStatus;
  date: string;
  validTill: string;
  salesPerson: string;
}

interface NewPIFormState {
  customer: string;
  project: string;
  items: string;
  amount: string;
  validTill: string;
  salesPerson: string;
}

const MOCK_PIS: ProformaInvoice[] = [
  { id: "PI-2026-0412", ref: "ZG/PI/26-27/0412", customer: "ABC Plastics Pvt Ltd", project: "WPE Pipe Supply - Phase 2", items: 5, amount: 425000, status: "confirmed", date: "2026-04-08", validTill: "2026-05-08", salesPerson: "Rajesh K" },
  { id: "PI-2026-0411", ref: "ZG/PI/26-27/0411", customer: "Metro Infrastructure", project: "Municipal Water Pipeline", items: 12, amount: 1850000, status: "fully_reserved", date: "2026-04-07", validTill: "2026-05-07", salesPerson: "Priya S" },
  { id: "PI-2026-0410", ref: "ZG/PI/26-27/0410", customer: "Southern Polymers", project: "Agricultural Pipes", items: 8, amount: 680000, status: "partially_reserved", date: "2026-04-06", validTill: "2026-05-06", salesPerson: "Amit D" },
  { id: "PI-2026-0409", ref: "ZG/PI/26-27/0409", customer: "Green Infra Ltd", project: "SWM Pipe Supply", items: 3, amount: 290000, status: "pending", date: "2026-04-05", validTill: "2026-05-05", salesPerson: "Rajesh K" },
  { id: "PI-2026-0408", ref: "ZG/PI/26-27/0408", customer: "XYZ Polymers Ltd", project: "Industrial Drainage", items: 6, amount: 520000, status: "ready_for_dispatch", date: "2026-04-04", validTill: "2026-05-04", salesPerson: "Meena P" },
  { id: "PI-2026-0407", ref: "ZG/PI/26-27/0407", customer: "National Distributors", project: "Retail Supply Q2", items: 15, amount: 2100000, status: "dispatch_in_progress", date: "2026-04-03", validTill: "2026-05-03", salesPerson: "Suresh J" },
  { id: "PI-2026-0406", ref: "ZG/PI/26-27/0406", customer: "Kavitha Enterprises", project: "Small Bore Pipes", items: 4, amount: 175000, status: "closed_won", date: "2026-04-01", validTill: "2026-05-01", salesPerson: "Priya S" },
  { id: "PI-2026-0405", ref: "ZG/PI/26-27/0405", customer: "Pan India Distribution", project: "Bulk WPE Order", items: 20, amount: 3200000, status: "pending", date: "2026-03-30", validTill: "2026-04-30", salesPerson: "Amit D" },
  { id: "PI-2026-0404", ref: "ZG/PI/26-27/0404", customer: "GreenTech Solutions", project: "Irrigation Pipes", items: 7, amount: 450000, status: "lost", date: "2026-03-28", validTill: "2026-04-28", salesPerson: "Rajesh K" },
  { id: "PI-2026-0403", ref: "ZG/PI/26-27/0403", customer: "BuildMax Corp", project: "Construction Pipes", items: 9, amount: 890000, status: "cancelled", date: "2026-03-25", validTill: "2026-04-25", salesPerson: "Meena P" },
];

const statusLabels: Record<PIStatus, string> = {
  pending: "Pending", confirmed: "Confirmed", partially_reserved: "Partially Reserved",
  fully_reserved: "Fully Reserved", ready_for_dispatch: "Ready for Dispatch",
  dispatch_in_progress: "Dispatch In Progress", cancelled: "Cancelled", lost: "Lost", closed_won: "Closed Won",
};

const statusColors: Record<PIStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  partially_reserved: "bg-accent/20 text-accent-foreground border-accent/30",
  fully_reserved: "bg-success/10 text-success border-success/20",
  ready_for_dispatch: "bg-success/20 text-success border-success/30",
  dispatch_in_progress: "bg-primary/20 text-primary border-primary/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  lost: "bg-muted text-muted-foreground border-muted",
  closed_won: "bg-success/10 text-success border-success/20",
};

const getFiscalYearLabel = (date: Date) => {
  const fiscalStartYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const fiscalEndYear = fiscalStartYear + 1;
  return `${String(fiscalStartYear).slice(-2)}-${String(fiscalEndYear).slice(-2)}`;
};

const getNextPISequence = (pis: ProformaInvoice[]) => {
  const sequenceNumbers = pis.map((pi) => {
    const idMatch = pi.id.match(/-(\d{4})$/);
    const refMatch = pi.ref.match(/\/(\d{4})$/);
    return Number(idMatch?.[1] ?? refMatch?.[1] ?? 0);
  });
  return Math.max(0, ...sequenceNumbers) + 1;
};

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultFormState = (): NewPIFormState => {
  const today = new Date();
  const validTill = new Date(today);
  validTill.setDate(today.getDate() + 30);

  return {
    customer: "",
    project: "",
    items: "",
    amount: "",
    validTill: formatDateForInput(validTill),
    salesPerson: "",
  };
};

const PresalesPage = () => {
  const [proformaInvoices, setProformaInvoices] = useState<ProformaInvoice[]>(MOCK_PIS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPIForm, setNewPIForm] = useState<NewPIFormState>(getDefaultFormState);
  const [formError, setFormError] = useState("");

  const filtered = proformaInvoices.filter((pi) => {
    const matchesSearch = pi.customer.toLowerCase().includes(search.toLowerCase()) || pi.ref.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" || pi.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalValue = proformaInvoices.reduce((sum, pi) => sum + pi.amount, 0);

  const handleOpenChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setFormError("");
      setNewPIForm(getDefaultFormState());
    }
  };

  const handleCreatePI = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const customer = newPIForm.customer.trim();
    const project = newPIForm.project.trim();
    const salesPerson = newPIForm.salesPerson.trim();
    const items = Number(newPIForm.items);
    const amount = Number(newPIForm.amount);

    if (!customer || !project || !salesPerson || !newPIForm.validTill) {
      setFormError("Please fill all required fields.");
      return;
    }

    if (!Number.isInteger(items) || items <= 0) {
      setFormError("Items must be a whole number greater than zero.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    const currentDate = new Date();
    const sequence = getNextPISequence(proformaInvoices);
    const sequenceLabel = String(sequence).padStart(4, "0");
    const fiscalYearLabel = getFiscalYearLabel(currentDate);

    const newPI: ProformaInvoice = {
      id: `PI-${currentDate.getFullYear()}-${sequenceLabel}`,
      ref: `ZG/PI/${fiscalYearLabel}/${sequenceLabel}`,
      customer,
      project,
      items,
      amount: Math.round(amount),
      status: "pending",
      date: formatDateForInput(currentDate),
      validTill: newPIForm.validTill,
      salesPerson,
    };

    setProformaInvoices((previousPIs) => [newPI, ...previousPIs]);
    setActiveTab("all");
    setSearch("");
    setFormError("");
    setNewPIForm(getDefaultFormState());
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Presales</h1>
            <p className="text-sm text-muted-foreground">Proforma invoices, sales orders & store requests</p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New PI</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create New Proforma Invoice</DialogTitle>
              <DialogDescription>Add PI details to start the presales flow.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreatePI}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pi-customer">Customer</Label>
                  <Input
                    id="pi-customer"
                    value={newPIForm.customer}
                    onChange={(event) => setNewPIForm((previous) => ({ ...previous, customer: event.target.value }))}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pi-project">Project</Label>
                  <Input
                    id="pi-project"
                    value={newPIForm.project}
                    onChange={(event) => setNewPIForm((previous) => ({ ...previous, project: event.target.value }))}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pi-items">Items</Label>
                  <Input
                    id="pi-items"
                    type="number"
                    min={1}
                    value={newPIForm.items}
                    onChange={(event) => setNewPIForm((previous) => ({ ...previous, items: event.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pi-amount">Amount (₹)</Label>
                  <Input
                    id="pi-amount"
                    type="number"
                    min={1}
                    value={newPIForm.amount}
                    onChange={(event) => setNewPIForm((previous) => ({ ...previous, amount: event.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pi-sales-person">Sales Person</Label>
                  <Input
                    id="pi-sales-person"
                    value={newPIForm.salesPerson}
                    onChange={(event) => setNewPIForm((previous) => ({ ...previous, salesPerson: event.target.value }))}
                    placeholder="Enter sales person"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pi-valid-till">Valid Till</Label>
                  <Input
                    id="pi-valid-till"
                    type="date"
                    value={newPIForm.validTill}
                    onChange={(event) => setNewPIForm((previous) => ({ ...previous, validTill: event.target.value }))}
                    required
                  />
                </div>
              </div>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                <Button type="submit" className="gap-2"><Plus className="h-4 w-4" /> Create PI</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-warning">{proformaInvoices.filter(p => p.status === "pending").length}</div><div className="text-xs text-muted-foreground">Pending PIs</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-primary">{proformaInvoices.filter(p => p.status === "confirmed").length}</div><div className="text-xs text-muted-foreground">Confirmed</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-success">{proformaInvoices.filter(p => ["fully_reserved", "ready_for_dispatch"].includes(p.status)).length}</div><div className="text-xs text-muted-foreground">Ready</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-foreground">₹{(totalValue / 100000).toFixed(1)}L</div><div className="text-xs text-muted-foreground">Pipeline Value</div></CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by customer or ref..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All ({proformaInvoices.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending PI</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed PI</TabsTrigger>
          <TabsTrigger value="partially_reserved">Partially Reserved</TabsTrigger>
          <TabsTrigger value="fully_reserved">Fully Reserved</TabsTrigger>
          <TabsTrigger value="ready_for_dispatch">Ready for Dispatch</TabsTrigger>
          <TabsTrigger value="closed_won">Closed Won</TabsTrigger>
          <TabsTrigger value="lost">Lost</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Valid Till</TableHead>
                    <TableHead>Sales Person</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((pi) => (
                    <TableRow key={pi.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">{pi.ref}</TableCell>
                      <TableCell className="font-medium">{pi.customer}</TableCell>
                      <TableCell className="text-sm">{pi.project}</TableCell>
                      <TableCell>{pi.items}</TableCell>
                      <TableCell className="text-right font-medium">₹{pi.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs ${statusColors[pi.status]}`}>{statusLabels[pi.status]}</Badge></TableCell>
                      <TableCell className="text-xs">{pi.date}</TableCell>
                      <TableCell className="text-xs">{pi.validTill}</TableCell>
                      <TableCell className="text-xs">{pi.salesPerson}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ModuleFormFieldsReference moduleId="saledoc" />
    </div>
  );
};

export default PresalesPage;
