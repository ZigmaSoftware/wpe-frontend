import { useState } from "react";
import { Wallet, Search, ArrowDownLeft, ArrowUpRight, Receipt, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ModuleFormFieldsReference from "@/components/ModuleFormFieldsReference";

type TxnType = "receipt" | "payment" | "credit_note" | "debit_note" | "journal" | "contra" | "expense";

interface Transaction {
  id: string;
  voucherNo: string;
  type: TxnType;
  party: string;
  amount: number;
  mode: "cash" | "bank" | "cheque" | "upi" | "neft";
  reference: string;
  date: string;
  narration: string;
  status: "completed" | "pending" | "bounced";
}

const MOCK_TXNS: Transaction[] = [
  { id: "TXN-9001", voucherNo: "ZG/REC/26-27/9001", type: "receipt", party: "ABC Plastics Pvt Ltd", amount: 425000, mode: "neft", reference: "NEFT/UTR/2026040912345", date: "2026-04-09", narration: "Against Invoice ZG/INV/26-27/4521", status: "completed" },
  { id: "TXN-9002", voucherNo: "ZG/PAY/26-27/5501", type: "payment", party: "Raw Material Suppliers Co", amount: 385000, mode: "neft", reference: "NEFT/UTR/2026040854321", date: "2026-04-08", narration: "Against PO ZG/PO/26-27/1201", status: "completed" },
  { id: "TXN-9003", voucherNo: "ZG/REC/26-27/9000", type: "receipt", party: "Metro Infrastructure", amount: 1000000, mode: "cheque", reference: "CHQ-456789", date: "2026-04-08", narration: "Part payment against PI-0411", status: "pending" },
  { id: "TXN-9004", voucherNo: "ZG/CN/26-27/201", type: "credit_note", party: "Kavitha Enterprises", amount: 15000, mode: "bank", reference: "CN-201", date: "2026-04-07", narration: "Quality issue credit - Pipe lot #45", status: "completed" },
  { id: "TXN-9005", voucherNo: "ZG/DN/26-27/101", type: "debit_note", party: "Chemical Traders", amount: 8500, mode: "bank", reference: "DN-101", date: "2026-04-06", narration: "Short delivery deduction", status: "completed" },
  { id: "TXN-9006", voucherNo: "ZG/JV/26-27/301", type: "journal", party: "Internal Adjustment", amount: 25000, mode: "bank", reference: "JV-301", date: "2026-04-05", narration: "Salary provision for March 2026", status: "completed" },
  { id: "TXN-9007", voucherNo: "ZG/PAY/26-27/5500", type: "payment", party: "TransCargo Logistics", amount: 45000, mode: "upi", reference: "UPI/2026040598765", date: "2026-04-05", narration: "Freight charges - Delivery to Jaipur", status: "completed" },
  { id: "TXN-9008", voucherNo: "ZG/EXP/26-27/401", type: "expense", party: "Misc Expenses", amount: 12500, mode: "cash", reference: "EXP-401", date: "2026-04-04", narration: "Plant maintenance supplies", status: "completed" },
  { id: "TXN-9009", voucherNo: "ZG/CON/26-27/50", type: "contra", party: "Bank Transfer", amount: 500000, mode: "bank", reference: "CON-50", date: "2026-04-03", narration: "Cash deposit to HDFC Bank", status: "completed" },
  { id: "TXN-9010", voucherNo: "ZG/REC/26-27/8999", type: "receipt", party: "XYZ Polymers Ltd", amount: 520000, mode: "neft", reference: "NEFT/UTR/2026040312345", date: "2026-04-03", narration: "Full payment against Invoice 4519", status: "completed" },
  { id: "TXN-9011", voucherNo: "ZG/PAY/26-27/5499", type: "payment", party: "Polymer World Pvt Ltd", amount: 540000, mode: "cheque", reference: "CHQ-789012", date: "2026-04-02", narration: "Against PO 1199", status: "bounced" },
];

const typeLabels: Record<TxnType, string> = {
  receipt: "Receipt", payment: "Payment", credit_note: "Credit Note", debit_note: "Debit Note",
  journal: "Journal", contra: "Contra", expense: "Expense",
};
const typeColors: Record<TxnType, string> = {
  receipt: "bg-success/10 text-success", payment: "bg-destructive/10 text-destructive",
  credit_note: "bg-warning/10 text-warning", debit_note: "bg-accent/20 text-accent-foreground",
  journal: "bg-primary/10 text-primary", contra: "bg-muted text-muted-foreground",
  expense: "bg-destructive/10 text-destructive",
};

const PaymentsPage = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filtered = MOCK_TXNS.filter((t) => {
    const matchesSearch = t.party.toLowerCase().includes(search.toLowerCase()) || t.voucherNo.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" || t.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalReceipts = MOCK_TXNS.filter(t => t.type === "receipt").reduce((s, t) => s + t.amount, 0);
  const totalPayments = MOCK_TXNS.filter(t => ["payment","expense"].includes(t.type)).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Wallet className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground">Receipts, payments, credit/debit notes & journals</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><ArrowDownLeft className="h-4 w-4 text-success" /><div><div className="text-lg font-bold text-success">₹{(totalReceipts/100000).toFixed(1)}L</div><div className="text-xs text-muted-foreground">Total Receipts</div></div></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-destructive" /><div><div className="text-lg font-bold text-destructive">₹{(totalPayments/100000).toFixed(1)}L</div><div className="text-xs text-muted-foreground">Total Payments</div></div></div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-warning">{MOCK_TXNS.filter(t => t.status === "pending").length}</div><div className="text-xs text-muted-foreground">Pending</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-destructive">{MOCK_TXNS.filter(t => t.status === "bounced").length}</div><div className="text-xs text-muted-foreground">Bounced</div></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="receipt">Receipts</TabsTrigger>
          <TabsTrigger value="payment">Payments</TabsTrigger>
          <TabsTrigger value="credit_note">Credit Notes</TabsTrigger>
          <TabsTrigger value="debit_note">Debit Notes</TabsTrigger>
          <TabsTrigger value="journal">Journals</TabsTrigger>
          <TabsTrigger value="contra">Contra</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Voucher #</TableHead><TableHead>Type</TableHead><TableHead>Party</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead><TableHead>Mode</TableHead>
                <TableHead>Reference</TableHead><TableHead>Narration</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{t.voucherNo}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-xs ${typeColors[t.type]}`}>{typeLabels[t.type]}</Badge></TableCell>
                    <TableCell className="font-medium">{t.party}</TableCell>
                    <TableCell className={`text-right font-medium ${t.type === "receipt" ? "text-success" : ""}`}>
                      {t.type === "receipt" ? "+" : "-"}₹{t.amount.toLocaleString()}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs uppercase">{t.mode}</Badge></TableCell>
                    <TableCell className="font-mono text-xs max-w-[120px] truncate">{t.reference}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{t.narration}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-xs ${t.status === "completed" ? "bg-success/10 text-success" : t.status === "bounced" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{t.status}</Badge></TableCell>
                    <TableCell className="text-xs">{t.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <ModuleFormFieldsReference moduleId="payment" />
    </div>
  );
};

export default PaymentsPage;
