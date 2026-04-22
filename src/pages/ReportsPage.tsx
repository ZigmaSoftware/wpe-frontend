import { BarChart3, FileText, Receipt, Calculator, Wrench, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReportLink {
  name: string;
  description: string;
  category: string;
}

const reportSections = [
  {
    title: "Transaction Reports",
    icon: FileText,
    reports: [
      { name: "Sales Report (Invoice wise & Qty wise)", description: "See all invoiced sales", category: "sales" },
      { name: "Sales Summary", description: "Summarized sales data", category: "sales" },
      { name: "Purchase Summary", description: "Summarized purchase data", category: "purchase" },
      { name: "Daily Report", description: "Day-wise transaction summary", category: "daily" },
      { name: "Opportunity Pipeline Report (Presales)", description: "Pipeline analysis", category: "presales" },
      { name: "Purchase Request Report", description: "All purchase requests", category: "purchase" },
      { name: "Purchase Report (Invoice wise & Qty wise)", description: "See all purchase inwards", category: "purchase" },
      { name: "Indent Pipeline Report", description: "Indent tracking", category: "indents" },
      { name: "Shipping Report", description: "Shipping and logistics data", category: "logistics" },
      { name: "Sales Order Report", description: "Opening stock, inwards, outwards, closing stock with date filter", category: "sales" },
    ],
  },
  {
    title: "Document Reports",
    icon: BarChart3,
    reports: [
      { name: "Presales Pipeline Report", description: "PI pipeline tracking", category: "presales" },
      { name: "Sales Pipeline Report (Invoice Based)", description: "Invoice-based pipeline", category: "sales" },
      { name: "Presales Activity Report", description: "Activity tracking", category: "presales" },
      { name: "Purchase Order Report", description: "PO analysis", category: "purchase" },
      { name: "Customer Sales Report", description: "Customer-wise sales", category: "sales" },
      { name: "Supplier Purchase Bill", description: "Supplier billing details", category: "purchase" },
      { name: "Payment Report", description: "Payment tracking", category: "payments" },
      { name: "Receivables Outstanding Report (Payments)", description: "Outstanding receivables", category: "payments" },
      { name: "Customer Outstanding Report", description: "Customer outstanding", category: "payments" },
      { name: "Supplier Outstanding Report", description: "Supplier outstanding", category: "payments" },
      { name: "Payables Report", description: "Payable analysis", category: "payments" },
      { name: "All Contacts Report", description: "Complete contact list", category: "contacts" },
      { name: "Customer Report", description: "Customer data export", category: "contacts" },
      { name: "Item Stock Details with Filters", description: "Filter by name, brand, HSN, stock status", category: "items" },
      { name: "Item Stock Report (As of Date)", description: "Historical stock levels", category: "items" },
      { name: "Stock Report (DW)", description: "Data warehouse stock report", category: "items" },
    ],
  },
  {
    title: "GST Reports",
    icon: Receipt,
    reports: [
      { name: "Sales Invoice", description: "GST-compliant sales invoices", category: "gst" },
      { name: "Sales Invoice (Without Error Check)", description: "Quick invoice generation", category: "gst" },
      { name: "GSTR1 B2B - Sales Report", description: "GSTR1 B2B filing data", category: "gst" },
      { name: "GST - Sales Returns", description: "Sales return GST data", category: "gst" },
      { name: "Sales Invoice (Line-item wise)", description: "Detailed line-item invoices", category: "gst" },
      { name: "GST - Sales Returns (Line-item wise)", description: "Line-item returns", category: "gst" },
      { name: "HSN Summary Report (Sales)", description: "HSN-wise sales summary", category: "gst" },
      { name: "HSN Summary Report Detailed (Sales)", description: "Detailed HSN sales", category: "gst" },
      { name: "Purchase Invoice", description: "Purchase GST invoices", category: "gst" },
      { name: "GST - Purchase Returns", description: "Purchase return GST", category: "gst" },
      { name: "HSN Summary Report (Purchase)", description: "HSN-wise purchase summary", category: "gst" },
      { name: "Purchase Invoice (Line-item wise)", description: "Line-item purchase invoices", category: "gst" },
    ],
  },
  {
    title: "Production Reports",
    icon: TrendingUp,
    reports: [
      { name: "Bin Connect Dashboard", description: "Live bin tracking and connectivity", category: "production" },
      { name: "Stage Management Report (Lamination)", description: "Lamination stage tracking", category: "production" },
      { name: "Stage Management Report (Tape Applicator)", description: "Tape applicator tracking", category: "production" },
      { name: "CHBR Movement Report", description: "CHBR material movement", category: "production" },
      { name: "Neutral Tape Movement Report", description: "Tape movement tracking", category: "production" },
      { name: "Scancode Split Report", description: "Scancode analysis", category: "production" },
      { name: "FG In Slip and Out Slip", description: "Finished goods in/out slips", category: "production" },
      { name: "Outward Scancode Report", description: "Outward scan tracking", category: "production" },
      { name: "Vehicle Despatch Summary", description: "Vehicle-wise dispatch data", category: "logistics" },
      { name: "Granulation Production Tool", description: "Granulation process tool", category: "production" },
      { name: "Granulation Production Report", description: "Granulation output analysis", category: "production" },
      { name: "Recycle Chip Report", description: "Recycled chip tracking", category: "production" },
      { name: "Recycle Chip Stock Report", description: "Recycled chip stock levels", category: "production" },
      { name: "BOM Wise Production Report", description: "BOM-based production output", category: "production" },
      { name: "Production Consumption Report", description: "Material consumption analysis", category: "production" },
      { name: "Production BOM Consumption Report", description: "BOM consumption tracking", category: "production" },
    ],
  },
  {
    title: "Other Reports & Tools",
    icon: Calculator,
    reports: [
      { name: "Tops Report", description: "Top performers analysis", category: "other" },
      { name: "Accounts Report - Sales and Purchase", description: "Combined accounts view", category: "accounts" },
      { name: "Activity Report", description: "User activity tracking", category: "other" },
      { name: "Expense Report", description: "Expense analysis", category: "accounts" },
      { name: "Item Report", description: "Item-wise analysis", category: "items" },
      { name: "Service Schedule Report", description: "Service schedule tracking", category: "service" },
      { name: "Non Moving Item Report", description: "Slow-moving inventory", category: "items" },
    ],
  },
  {
    title: "Admin & Account Tools",
    icon: Wrench,
    reports: [
      { name: "Payment Mismatch", description: "Find payment discrepancies", category: "tools" },
      { name: "Find/Fix Wrong Transactions (Presales)", description: "Presales correction tool", category: "tools" },
      { name: "Find/Fix Wrong Transactions (Sales)", description: "Sales correction tool", category: "tools" },
      { name: "Find/Fix Wrong Transactions (Indent)", description: "Indent correction tool", category: "tools" },
      { name: "Find/Fix Wrong Transactions (Purchase)", description: "Purchase correction tool", category: "tools" },
      { name: "Bulk Import Contacts", description: "Mass contact upload", category: "tools" },
      { name: "Bulk Import Items", description: "Mass item upload", category: "tools" },
      { name: "Bulk Import Users", description: "Mass user upload", category: "tools" },
      { name: "Demand Sheet", description: "Demand planning tool", category: "tools" },
      { name: "Demand Sheet with Plan", description: "Demand planning with production plan", category: "tools" },
      { name: "Inward Outward Analysis", description: "Stock flow analysis", category: "tools" },
      { name: "Transaction History Report", description: "Full transaction audit trail", category: "tools" },
      { name: "Financial Year Setup", description: "FY configuration", category: "tools" },
    ],
  },
];

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Tools</h1>
          <p className="text-sm text-muted-foreground">Transaction, document, GST, production reports & admin tools</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {reportSections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <section.icon className="h-5 w-5 text-primary" />
                {section.title}
                <Badge variant="outline" className="ml-auto text-xs">{section.reports.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-2">
                {section.reports.map((report) => (
                  <div
                    key={report.name}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{report.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{report.description}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] ml-2 flex-shrink-0">{report.category}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
