import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import ModuleFormFieldsReference from "@/components/ModuleFormFieldsReference";

type WorkflowStage =
  | "indent"
  | "purchase_quote"
  | "exec_approval"
  | "pm_approval"
  | "ph_approval"
  | "gm_approval"
  | "md_approval"
  | "purchase_order"
  | "processed";
type IndentStatus = WorkflowStage | "cancelled";

interface Indent {
  id: string;
  ref: string;
  requestedBy: string;
  department: string;
  items: number;
  amount: number;
  status: IndentStatus;
  date: string;
  priority: "low" | "medium" | "high" | "urgent";
}

const MOCK_INDENTS: Indent[] = [
  { id: "IND-0892", ref: "ZG/IND/26-27/0892", requestedBy: "Plant Manager", department: "Production", items: 5, amount: 285000, status: "pm_approval", date: "2026-04-09", priority: "high" },
  { id: "IND-0891", ref: "ZG/IND/26-27/0891", requestedBy: "Store Incharge", department: "Store", items: 12, amount: 145000, status: "exec_approval", date: "2026-04-08", priority: "medium" },
  { id: "IND-0890", ref: "ZG/IND/26-27/0890", requestedBy: "QC Head", department: "Quality", items: 3, amount: 52000, status: "indent", date: "2026-04-08", priority: "low" },
  { id: "IND-0889", ref: "ZG/IND/26-27/0889", requestedBy: "Maintenance Head", department: "Maintenance", items: 2, amount: 185000, status: "gm_approval", date: "2026-04-07", priority: "urgent" },
  { id: "IND-0888", ref: "ZG/IND/26-27/0888", requestedBy: "Plant Manager", department: "Production", items: 8, amount: 420000, status: "ph_approval", date: "2026-04-06", priority: "high" },
  { id: "IND-0887", ref: "ZG/IND/26-27/0887", requestedBy: "Store Incharge", department: "Store", items: 15, amount: 92000, status: "purchase_order", date: "2026-04-05", priority: "medium" },
  { id: "IND-0886", ref: "ZG/IND/26-27/0886", requestedBy: "Plant Manager", department: "Production", items: 6, amount: 310000, status: "md_approval", date: "2026-04-04", priority: "high" },
  { id: "IND-0885", ref: "ZG/IND/26-27/0885", requestedBy: "Admin", department: "Admin", items: 20, amount: 35000, status: "processed", date: "2026-04-03", priority: "low" },
  { id: "IND-0884", ref: "ZG/IND/26-27/0884", requestedBy: "Maintenance Head", department: "Maintenance", items: 1, amount: 85000, status: "purchase_order", date: "2026-04-02", priority: "medium" },
  { id: "IND-0883", ref: "ZG/IND/26-27/0883", requestedBy: "QC Head", department: "Quality", items: 4, amount: 28000, status: "cancelled", date: "2026-04-01", priority: "low" },
];

const statusLabels: Record<IndentStatus, string> = {
  indent: "Indent", purchase_quote: "Purchase Quote", exec_approval: "Exec. Approval",
  pm_approval: "PM Approval", ph_approval: "PH Approval", gm_approval: "GM Approval",
  md_approval: "MD Approval", purchase_order: "Purchase Order", processed: "Processed", cancelled: "Cancelled",
};
const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground", medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning", urgent: "bg-destructive/10 text-destructive",
};

type StageFieldType = "text" | "number" | "date" | "textarea" | "select";

interface StageFieldConfig {
  key: string;
  label: string;
  type: StageFieldType;
  placeholder?: string;
  options?: string[];
}

interface StageConfig {
  key: WorkflowStage;
  shortLabel: string;
  label: string;
  fields: StageFieldConfig[];
}

type StageValues = Record<string, string>;
type WorkflowFormState = Record<WorkflowStage, StageValues>;

const workflowStages: StageConfig[] = [
  {
    key: "indent",
    shortLabel: "Indent",
    label: "Indent Request",
    fields: [
      { key: "indentRef", label: "Indent Ref", type: "text", placeholder: "ZG/IND/..." },
      { key: "requestedBy", label: "Requested By", type: "text", placeholder: "Requester name" },
      { key: "department", label: "Department", type: "text", placeholder: "Department" },
      { key: "requiredDate", label: "Required Date", type: "date" },
      { key: "indentRemarks", label: "Indent Remarks", type: "textarea", placeholder: "Requirement details..." },
    ],
  },
  {
    key: "purchase_quote",
    shortLabel: "Quote",
    label: "Vendor Quote",
    fields: [
      { key: "vendorName", label: "Vendor Name", type: "text", placeholder: "Vendor / supplier" },
      { key: "quoteRef", label: "Quote Ref", type: "text", placeholder: "Quote number" },
      { key: "quoteAmount", label: "Quote Amount (₹)", type: "number", placeholder: "0" },
      { key: "quoteDate", label: "Quote Date", type: "date" },
      { key: "quoteRemarks", label: "Quote Remarks", type: "textarea", placeholder: "Commercial and technical remarks..." },
    ],
  },
  {
    key: "exec_approval",
    shortLabel: "Exec",
    label: "Executive Approval",
    fields: [
      { key: "execDecision", label: "Decision", type: "select", options: ["Approved", "Rejected", "On Hold"] },
      { key: "execApprover", label: "Approved By", type: "text", placeholder: "Executive name" },
      { key: "execDate", label: "Decision Date", type: "date" },
      { key: "execRemarks", label: "Remarks", type: "textarea", placeholder: "Approval note..." },
    ],
  },
  {
    key: "pm_approval",
    shortLabel: "PM",
    label: "PM Approval",
    fields: [
      { key: "pmDecision", label: "Decision", type: "select", options: ["Approved", "Rejected", "On Hold"] },
      { key: "pmApprover", label: "Approved By", type: "text", placeholder: "Plant Manager name" },
      { key: "pmDate", label: "Decision Date", type: "date" },
      { key: "pmRemarks", label: "Remarks", type: "textarea", placeholder: "Approval note..." },
    ],
  },
  {
    key: "ph_approval",
    shortLabel: "PH",
    label: "PH Approval",
    fields: [
      { key: "phDecision", label: "Decision", type: "select", options: ["Approved", "Rejected", "On Hold"] },
      { key: "phApprover", label: "Approved By", type: "text", placeholder: "Plant Head name" },
      { key: "phDate", label: "Decision Date", type: "date" },
      { key: "phRemarks", label: "Remarks", type: "textarea", placeholder: "Approval note..." },
    ],
  },
  {
    key: "gm_approval",
    shortLabel: "GM",
    label: "GM Approval",
    fields: [
      { key: "gmDecision", label: "Decision", type: "select", options: ["Approved", "Rejected", "On Hold"] },
      { key: "gmApprover", label: "Approved By", type: "text", placeholder: "General Manager name" },
      { key: "gmDate", label: "Decision Date", type: "date" },
      { key: "gmRemarks", label: "Remarks", type: "textarea", placeholder: "Approval note..." },
    ],
  },
  {
    key: "md_approval",
    shortLabel: "MD",
    label: "MD Approval",
    fields: [
      { key: "mdDecision", label: "Decision", type: "select", options: ["Approved", "Rejected", "On Hold"] },
      { key: "mdApprover", label: "Approved By", type: "text", placeholder: "Managing Director name" },
      { key: "mdDate", label: "Decision Date", type: "date" },
      { key: "mdRemarks", label: "Remarks", type: "textarea", placeholder: "Approval note..." },
    ],
  },
  {
    key: "purchase_order",
    shortLabel: "PO",
    label: "Purchase Order",
    fields: [
      { key: "poRef", label: "PO Ref", type: "text", placeholder: "ZG/PO/..." },
      { key: "supplierName", label: "Supplier Name", type: "text", placeholder: "Supplier / vendor" },
      { key: "poAmount", label: "PO Amount (₹)", type: "number", placeholder: "0" },
      { key: "poDate", label: "PO Date", type: "date" },
      { key: "deliveryDate", label: "Expected Delivery", type: "date" },
      { key: "poRemarks", label: "PO Remarks", type: "textarea", placeholder: "Delivery and commercial notes..." },
    ],
  },
  {
    key: "processed",
    shortLabel: "Done",
    label: "Done / Closed",
    fields: [
      { key: "grnNo", label: "GRN No", type: "text", placeholder: "GRN reference" },
      { key: "inwardDate", label: "Inward Date", type: "date" },
      { key: "invoiceNo", label: "Vendor Invoice No", type: "text", placeholder: "Invoice number" },
      { key: "closedBy", label: "Closed By", type: "text", placeholder: "User name" },
      { key: "closureRemarks", label: "Closure Remarks", type: "textarea", placeholder: "Closure summary..." },
    ],
  },
];

const stageIndexMap = workflowStages.reduce((acc, stage, index) => {
  acc[stage.key] = index + 1;
  return acc;
}, {} as Record<WorkflowStage, number>);

const statusToStage = (status: IndentStatus): WorkflowStage => {
  if (status === "cancelled") {
    return "indent";
  }
  return status;
};

const getApprovalStage = (status: IndentStatus) => {
  if (status === "cancelled") {
    return 0;
  }
  return stageIndexMap[status];
};

const createBlankWorkflowForm = (): WorkflowFormState =>
  workflowStages.reduce((acc, stage) => {
    acc[stage.key] = stage.fields.reduce((fieldAcc, field) => {
      fieldAcc[field.key] = "";
      return fieldAcc;
    }, {} as StageValues);
    return acc;
  }, {} as WorkflowFormState);

const createInitialWorkflowForm = (indent: Indent): WorkflowFormState => {
  const initial = createBlankWorkflowForm();
  initial.indent.indentRef = indent.ref;
  initial.indent.requestedBy = indent.requestedBy;
  initial.indent.department = indent.department;
  return initial;
};

const IndentsPage = () => {
  const [indents, setIndents] = useState<Indent[]>(MOCK_INDENTS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIndentId, setSelectedIndentId] = useState(MOCK_INDENTS[0]?.id ?? "");
  const [activeStage, setActiveStage] = useState<WorkflowStage>("indent");
  const [formsByIndent, setFormsByIndent] = useState<Record<string, WorkflowFormState>>(
    () =>
      MOCK_INDENTS.reduce((acc, indent) => {
        acc[indent.id] = createInitialWorkflowForm(indent);
        return acc;
      }, {} as Record<string, WorkflowFormState>),
  );
  const [stageDraft, setStageDraft] = useState<StageValues>({});
  const [formMessage, setFormMessage] = useState("");

  const selectedIndent = indents.find((ind) => ind.id === selectedIndentId) ?? indents[0];
  const activeStageConfig = workflowStages.find((stage) => stage.key === activeStage) ?? workflowStages[0];

  const filtered = useMemo(
    () =>
      indents.filter((ind) => {
        const matchesSearch =
          ind.ref.toLowerCase().includes(search.toLowerCase()) ||
          ind.requestedBy.toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === "all" || ind.status === activeTab;
        return matchesSearch && matchesTab;
      }),
    [activeTab, indents, search],
  );

  const pendingApprovals = indents.filter((indent) =>
    ["exec_approval", "pm_approval", "ph_approval", "gm_approval", "md_approval"].includes(indent.status),
  ).length;

  useEffect(() => {
    if (!selectedIndent) {
      setStageDraft({});
      return;
    }

    const existing = formsByIndent[selectedIndent.id] ?? createInitialWorkflowForm(selectedIndent);
    setStageDraft(existing[activeStage] ?? {});
  }, [activeStage, formsByIndent, selectedIndent]);

  const handleSelectIndent = (indent: Indent) => {
    setSelectedIndentId(indent.id);
    setActiveStage(statusToStage(indent.status));
    setFormMessage("");
  };

  const handleDraftChange = (fieldKey: string, value: string) => {
    setStageDraft((previous) => ({ ...previous, [fieldKey]: value }));
  };

  const handleSaveStageForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedIndent) {
      return;
    }

    const nextStageData = { ...stageDraft };
    const stageLabel = activeStageConfig.shortLabel;

    setFormsByIndent((previous) => {
      const existingForIndent = previous[selectedIndent.id] ?? createInitialWorkflowForm(selectedIndent);
      return {
        ...previous,
        [selectedIndent.id]: {
          ...existingForIndent,
          [activeStage]: nextStageData,
        },
      };
    });

    setIndents((previous) =>
      previous.map((indent) => {
        if (indent.id !== selectedIndent.id) {
          return indent;
        }

        const amountFromQuote = Number(nextStageData.quoteAmount);
        const amountFromPO = Number(nextStageData.poAmount);
        const amountUpdate =
          activeStage === "purchase_quote" && Number.isFinite(amountFromQuote) && amountFromQuote > 0
            ? Math.round(amountFromQuote)
            : activeStage === "purchase_order" && Number.isFinite(amountFromPO) && amountFromPO > 0
              ? Math.round(amountFromPO)
              : indent.amount;

        const requestedByUpdate =
          activeStage === "indent" && nextStageData.requestedBy?.trim().length
            ? nextStageData.requestedBy.trim()
            : indent.requestedBy;
        const departmentUpdate =
          activeStage === "indent" && nextStageData.department?.trim().length
            ? nextStageData.department.trim()
            : indent.department;

        return {
          ...indent,
          status: activeStage,
          amount: amountUpdate,
          requestedBy: requestedByUpdate,
          department: departmentUpdate,
        };
      }),
    );

    setFormMessage(`${stageLabel} form saved in local state for ${selectedIndent.ref}.`);
    setActiveTab("all");
  };

  const selectedWorkflowState = selectedIndent ? formsByIndent[selectedIndent.id] : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indents</h1>
          <p className="text-sm text-muted-foreground">Purchase indents with multi-level approval workflow</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-warning">{pendingApprovals}</div><div className="text-xs text-muted-foreground">Pending Approvals</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-primary">{indents.filter(i => i.status === "purchase_order").length}</div><div className="text-xs text-muted-foreground">Purchase Orders</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-success">{indents.filter(i => i.status === "processed").length}</div><div className="text-xs text-muted-foreground">Processed</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-destructive">{indents.filter(i => i.priority === "urgent").length}</div><div className="text-xs text-muted-foreground">Urgent</div></CardContent></Card>
      </div>

      {/* Approval Workflow Visual */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Approval Workflow Pipeline</h3>
          <div className="flex items-center gap-1 text-xs overflow-x-auto pb-2">
            {workflowStages.map((stage, index) => (
              <div key={stage.key} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveStage(stage.key)}
                  className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                    stage.key === activeStage
                      ? "bg-primary text-primary-foreground"
                      : stage.key === "processed"
                        ? "bg-success/10 text-success"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  {stage.shortLabel}
                </button>
                {index < workflowStages.length - 1 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Stage Form Entry (Local State)</h3>
              <p className="text-xs text-muted-foreground">
                Selected:{" "}
                <span className="font-mono">{selectedIndent?.ref ?? "No indent selected"}</span>{" "}
                {selectedIndent ? `(${statusLabels[selectedIndent.status]})` : ""}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Active Stage: {activeStageConfig.shortLabel}
            </Badge>
          </div>

          <form onSubmit={handleSaveStageForm} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {activeStageConfig.fields.map((field) => {
                const value = stageDraft[field.key] ?? "";
                const isTextarea = field.type === "textarea";
                const isFullWidth = isTextarea;

                return (
                  <div key={field.key} className={`space-y-2 ${isFullWidth ? "md:col-span-2" : ""}`}>
                    <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                    {field.type === "textarea" ? (
                      <Textarea
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(event) => handleDraftChange(field.key, event.target.value)}
                      />
                    ) : field.type === "select" ? (
                      <select
                        value={value}
                        onChange={(event) => handleDraftChange(field.key, event.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type={field.type}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(event) => handleDraftChange(field.key, event.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit">Save {activeStageConfig.shortLabel} Form</Button>
              {formMessage ? <p className="text-xs text-success">{formMessage}</p> : null}
            </div>
          </form>

          <div className="grid gap-2 md:grid-cols-3">
            {workflowStages.map((stage) => {
              const populated = Object.values(selectedWorkflowState?.[stage.key] ?? {}).filter((value) => value.trim().length > 0).length;
              return (
                <div key={stage.key} className="rounded-md border border-border p-2">
                  <div className="text-xs font-semibold text-foreground">{stage.shortLabel}</div>
                  <div className="text-[11px] text-muted-foreground">{populated > 0 ? `${populated} fields captured` : "No data captured"}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search indents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="indent">Indents</TabsTrigger>
          <TabsTrigger value="purchase_quote">Quotes</TabsTrigger>
          <TabsTrigger value="exec_approval">Exec Approval</TabsTrigger>
          <TabsTrigger value="pm_approval">PM Approval</TabsTrigger>
          <TabsTrigger value="ph_approval">PH Approval</TabsTrigger>
          <TabsTrigger value="gm_approval">GM Approval</TabsTrigger>
          <TabsTrigger value="md_approval">MD Approval</TabsTrigger>
          <TabsTrigger value="purchase_order">Purchase Orders</TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Ref #</TableHead><TableHead>Requested By</TableHead><TableHead>Dept</TableHead>
                <TableHead>Items</TableHead><TableHead className="text-right">Amount (₹)</TableHead>
                <TableHead>Priority</TableHead><TableHead>Stage</TableHead><TableHead>Progress</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((ind) => (
                  <TableRow
                    key={ind.id}
                    className={`cursor-pointer hover:bg-muted/50 ${selectedIndentId === ind.id ? "bg-primary/5" : ""}`}
                    onClick={() => handleSelectIndent(ind)}
                  >
                    <TableCell className="font-mono text-xs">{ind.ref}</TableCell>
                    <TableCell className="font-medium">{ind.requestedBy}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{ind.department}</Badge></TableCell>
                    <TableCell>{ind.items}</TableCell>
                    <TableCell className="text-right font-medium">₹{ind.amount.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-xs ${priorityColors[ind.priority]}`}>{ind.priority}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{statusLabels[ind.status]}</Badge></TableCell>
                    <TableCell className="w-24"><Progress value={(getApprovalStage(ind.status) / workflowStages.length) * 100} className="h-2" /></TableCell>
                    <TableCell className="text-xs">{ind.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <ModuleFormFieldsReference moduleId="indentsaledoc" />
    </div>
  );
};

export default IndentsPage;
