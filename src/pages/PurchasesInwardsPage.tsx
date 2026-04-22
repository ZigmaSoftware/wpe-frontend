import { useMemo, useState } from "react";
import {
  Copy,
  Eye,
  Filter,
  PackageOpen,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ModuleFormFieldsReference from "@/components/ModuleFormFieldsReference";

type InwardStatus =
  | "goods_in_transit"
  | "gate_entry"
  | "grn_process"
  | "grn_scan"
  | "grn"
  | "material_in"
  | "purchase_return"
  | "iut_in_transit"
  | "iut_received"
  | "iut_scanned"
  | "cancelled";

interface PurchaseInward {
  id: string;
  poRef: string;
  supplier: string;
  items: number;
  amount: number;
  status: InwardStatus;
  date: string;
  grnNo: string;
  gateEntryNo: string;
  vehicle: string;
}

const MOCK_INWARDS: PurchaseInward[] = [
  {
    id: "PW-1201",
    poRef: "ZG/PO/26-27/1201",
    supplier: "Raw Material Suppliers Co",
    items: 4,
    amount: 385000,
    status: "gate_entry",
    date: "2026-04-09",
    grnNo: "-",
    gateEntryNo: "GE-4501",
    vehicle: "MH-12-XY-4567",
  },
  {
    id: "PW-1200",
    poRef: "ZG/PO/26-27/1200",
    supplier: "Chemical Traders",
    items: 6,
    amount: 192000,
    status: "grn_process",
    date: "2026-04-08",
    grnNo: "GRN-8901",
    gateEntryNo: "GE-4500",
    vehicle: "TN-33-AB-1234",
  },
  {
    id: "PW-1199",
    poRef: "ZG/PO/26-27/1199",
    supplier: "Polymer World Pvt Ltd",
    items: 3,
    amount: 540000,
    status: "goods_in_transit",
    date: "2026-04-08",
    grnNo: "-",
    gateEntryNo: "-",
    vehicle: "GJ-05-CD-7890",
  },
  {
    id: "PW-1198",
    poRef: "ZG/PO/26-27/1198",
    supplier: "National Chemical Corp",
    items: 8,
    amount: 128000,
    status: "grn_scan",
    date: "2026-04-07",
    grnNo: "GRN-8900",
    gateEntryNo: "GE-4499",
    vehicle: "RJ-14-EF-3456",
  },
  {
    id: "PW-1197",
    poRef: "ZG/PO/26-27/1197",
    supplier: "Raw Material Suppliers Co",
    items: 10,
    amount: 720000,
    status: "grn",
    date: "2026-04-06",
    grnNo: "GRN-8899",
    gateEntryNo: "GE-4498",
    vehicle: "MH-04-GH-9012",
  },
  {
    id: "PW-1196",
    poRef: "ZG/PO/26-27/1196",
    supplier: "Additive Solutions",
    items: 2,
    amount: 85000,
    status: "material_in",
    date: "2026-04-05",
    grnNo: "GRN-8898",
    gateEntryNo: "GE-4497",
    vehicle: "KA-01-IJ-5678",
  },
  {
    id: "PW-1195",
    poRef: "ZG/PO/26-27/1195",
    supplier: "Chemical Traders",
    items: 5,
    amount: 210000,
    status: "purchase_return",
    date: "2026-04-04",
    grnNo: "GRN-8897",
    gateEntryNo: "GE-4496",
    vehicle: "-",
  },
  {
    id: "IUT-301",
    poRef: "ZG/IUT/26-27/301",
    supplier: "Zigma Unit - Nashik",
    items: 3,
    amount: 156000,
    status: "iut_in_transit",
    date: "2026-04-08",
    grnNo: "-",
    gateEntryNo: "-",
    vehicle: "MH-15-KL-2345",
  },
  {
    id: "IUT-300",
    poRef: "ZG/IUT/26-27/300",
    supplier: "Zigma Unit - Pune",
    items: 7,
    amount: 280000,
    status: "iut_received",
    date: "2026-04-07",
    grnNo: "GRN-IUT-450",
    gateEntryNo: "GE-4495",
    vehicle: "MH-12-MN-6789",
  },
  {
    id: "IUT-299",
    poRef: "ZG/IUT/26-27/299",
    supplier: "Zigma Unit - Mumbai",
    items: 5,
    amount: 195000,
    status: "iut_scanned",
    date: "2026-04-06",
    grnNo: "GRN-IUT-449",
    gateEntryNo: "GE-4494",
    vehicle: "MH-04-OP-1234",
  },
];

const processTabs = [
  { id: "goods_in_transit", label: "Goods in Transit" },
  { id: "gate_entry", label: "Gate Entry" },
  { id: "grn_process", label: "GRN Process" },
  { id: "qcr", label: "QCR" },
  { id: "grn_scan", label: "GRN Scan" },
  { id: "grn", label: "GRN" },
  { id: "grn_manual", label: "GRN (Manual)" },
  { id: "material_in", label: "Material In" },
  { id: "purchase_inward", label: "Purchase Inward" },
  { id: "cancelled_orders", label: "Cancelled Orders" },
  { id: "cancelled_grn", label: "Cancelled GRN" },
  { id: "purchase_return", label: "Purchase Returns" },
  { id: "iut_in_transit", label: "IUT In Transit" },
  { id: "iut_received", label: "IUT Received" },
  { id: "iut_scanned", label: "IUT Scanned" },
  { id: "all", label: "All" },
];

const statusFilters: Record<string, InwardStatus[]> = {
  goods_in_transit: ["goods_in_transit", "iut_in_transit"],
  gate_entry: ["gate_entry"],
  grn_process: ["grn_process"],
  qcr: ["grn_scan"],
  grn_scan: ["grn_scan"],
  grn: ["grn"],
  grn_manual: ["grn"],
  material_in: ["material_in"],
  purchase_inward: ["material_in"],
  cancelled_orders: ["cancelled"],
  cancelled_grn: ["cancelled"],
  purchase_return: ["purchase_return"],
  iut_in_transit: ["iut_in_transit"],
  iut_received: ["iut_received"],
  iut_scanned: ["iut_scanned"],
  all: [
    "goods_in_transit",
    "gate_entry",
    "grn_process",
    "grn_scan",
    "grn",
    "material_in",
    "purchase_return",
    "iut_in_transit",
    "iut_received",
    "iut_scanned",
    "cancelled",
  ],
};

const formTabs = [
  "GENERAL",
  "ITEMS",
  "TERMS",
  "FORMS",
  "SHIPPING",
  "PAYMENTS",
  "RESOURCES",
  "NOTES",
  "PDFS",
];

const fieldLabelClass = "text-[11px] font-medium text-[#25303a]";
const inputClass =
  "h-7 rounded-none border-[#c9c9c9] bg-[#f9f9f9] px-2 text-[12px] focus-visible:ring-1 focus-visible:ring-[#5d7ea7]";
const textareaClass =
  "min-h-[54px] rounded-none border-[#c9c9c9] bg-[#f9f9f9] p-2 text-[12px] focus-visible:ring-1 focus-visible:ring-[#5d7ea7]";
const selectClass =
  "h-7 rounded-none border border-[#c9c9c9] bg-[#f9f9f9] px-2 text-[12px] text-[#1d2732] focus:outline-none focus:ring-1 focus:ring-[#5d7ea7]";

const SectionBox = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="relative rounded border border-[#bfc2c7] bg-[#efefef] p-3">
    <span className="absolute -top-3 left-3 rounded-sm bg-[#787d85] px-2 py-0.5 text-[11px] font-semibold text-white">
      {title}
    </span>
    {children}
  </section>
);

const Field = ({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) => (
  <div className="space-y-1">
    <label className={fieldLabelClass}>
      {label}
      {required ? <span className="text-[#cf2020]">*</span> : null}
    </label>
    {hint ? <p className="text-[10px] italic text-[#93969b]">{hint}</p> : null}
    {children}
  </div>
);

const PurchasesInwardsPage = () => {
  const [search, setSearch] = useState("");
  const [activeProcess, setActiveProcess] = useState("goods_in_transit");
  const [activeFormTab, setActiveFormTab] = useState("GENERAL");
  const [selectedId, setSelectedId] = useState(MOCK_INWARDS[0]?.id ?? "");

  const filteredInwards = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const statuses = statusFilters[activeProcess] ?? statusFilters.all;

    return MOCK_INWARDS.filter((entry) => {
      const matchesStatus = statuses.includes(entry.status);
      const matchesSearch =
        normalized.length === 0 ||
        entry.supplier.toLowerCase().includes(normalized) ||
        entry.poRef.toLowerCase().includes(normalized) ||
        entry.id.toLowerCase().includes(normalized);

      return matchesStatus && matchesSearch;
    });
  }, [activeProcess, search]);

  const selectedRecord =
    filteredInwards.find((entry) => entry.id === selectedId) ?? filteredInwards[0] ?? MOCK_INWARDS[0];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="-mx-4 -my-4 lg:-mx-6 lg:-my-6 h-full min-h-[calc(100vh-3.5rem)] bg-[#3a3b3e] text-[#202a34]">
      <div className="flex h-full flex-col p-4">
        <div className="mb-2 flex items-center gap-2 text-[#f5f7fa]">
          <PackageOpen className="h-5 w-5" />
          <h1 className="text-sm font-semibold tracking-wide">PURCHASES & INWARDS - GRN ENTRY</h1>
        </div>

        <div className="rounded border border-[#2a2e33] bg-[#d9d9d9] shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          <div className="border-b border-[#2c3138] bg-[#3b3f45] px-2 py-2">
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {processTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveProcess(tab.id)}
                  className={cn(
                    "whitespace-nowrap rounded px-2 py-1 text-[12px] font-semibold transition-colors",
                    activeProcess === tab.id
                      ? "bg-[#cf4b3f] text-white"
                      : "text-[#d6d9dd] hover:bg-[#555b63]",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-[#2d3339] bg-[#2b2f33] px-2 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-8 rounded-sm bg-[#373d44] px-3 text-xs text-[#eef1f4] hover:bg-[#404752]">
                <Plus className="h-3.5 w-3.5" />
                Add New
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-sm bg-[#373d44] px-3 text-xs text-[#eef1f4] hover:bg-[#404752]"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Merged
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-sm bg-[#373d44] px-3 text-xs text-[#eef1f4] hover:bg-[#404752]"
              >
                <Eye className="h-3.5 w-3.5" />
                Hide
              </Button>

              <div className="relative min-w-[280px] flex-1 max-w-lg">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a3a7ac]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search a saledoc by id, customer, items or total amount"
                  className="h-8 rounded-none border-[#4a4f56] bg-[#3a4047] pl-7 text-xs text-[#e8ebef] placeholder:text-[#9ca3ad]"
                />
              </div>

              <Button size="sm" className="h-8 rounded-none bg-[#3a4047] px-4 text-xs hover:bg-[#474e57]">
                Search
              </Button>
              <Button size="sm" className="h-8 rounded-none bg-[#3a4047] px-4 text-xs hover:bg-[#474e57]">
                <Filter className="h-3.5 w-3.5" />
                Filters
              </Button>
            </div>
          </div>

          <div className="grid min-h-[640px] grid-cols-1 xl:grid-cols-[44%_56%]">
            <div className="border-r border-[#a8adb4] bg-[#d2d3d6]">
              <div className="max-h-[640px] overflow-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead className="sticky top-0 z-20 bg-[#ececee] text-[#1b232b]">
                    <tr>
                      <th className="w-[36px] border border-[#bfc3c9] p-1 text-left">P</th>
                      <th className="w-[120px] border border-[#bfc3c9] p-1 text-left">Ref#</th>
                      <th className="border border-[#bfc3c9] p-1 text-left">Project / Supplier</th>
                      <th className="w-[120px] border border-[#bfc3c9] p-1 text-left">Amount</th>
                      <th className="w-[95px] border border-[#bfc3c9] p-1 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInwards.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="border border-[#bcc1c9] p-4 text-center text-[#69707a]">
                          No records found for selected process.
                        </td>
                      </tr>
                    ) : (
                      filteredInwards.map((entry) => {
                        const isActive = selectedRecord?.id === entry.id;

                        return (
                          <tr
                            key={entry.id}
                            onClick={() => setSelectedId(entry.id)}
                            className={cn(
                              "cursor-pointer border-b border-[#c4c8ce] text-[#2a2d31]",
                              isActive ? "bg-[#f3f4f6]" : "hover:bg-[#e6e8eb]",
                            )}
                          >
                            <td className="border border-[#c4c8ce] p-1 text-center">●</td>
                            <td className="border border-[#c4c8ce] p-1 font-semibold text-[#bc5c23]">{entry.id}</td>
                            <td className="border border-[#c4c8ce] p-1 font-semibold text-[#b34c18]">{entry.supplier}</td>
                            <td className="border border-[#c4c8ce] p-1 font-semibold text-[#a64e1f]">
                              {entry.amount.toLocaleString("en-IN")} INR
                            </td>
                            <td className="border border-[#c4c8ce] p-1 font-semibold text-[#a64e1f]">{entry.date}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex min-h-[640px] flex-col bg-[#eeeeee]">
              <div className="flex items-center justify-between border-b border-[#2f343a] bg-gradient-to-b from-[#42474e] to-[#1f2126] px-3 py-2 text-white">
                <h2 className="text-[24px] font-semibold tracking-tight">/ Add (* required fields)</h2>
                <div className="flex items-center gap-1">
                  <Button size="sm" className="h-7 rounded-none bg-[#33383f] px-3 text-xs hover:bg-[#424954]">
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                  <Button size="sm" className="h-7 rounded-none bg-[#33383f] px-3 text-xs hover:bg-[#424954]">
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-end border-b border-[#c9ccd0] px-3 py-2 text-[12px]">
                <span className="mr-1 font-semibold text-[#202a34]">Branch*:</span>
                <select className={cn(selectClass, "w-[126px]")}> 
                  <option>CBE</option>
                  <option>MUM</option>
                  <option>DEL</option>
                </select>
              </div>

              <div className="border-b border-[#c9ccd0] px-3 py-2">
                <div className="flex gap-1 overflow-x-auto pb-0.5">
                  {formTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveFormTab(tab)}
                      className={cn(
                        "whitespace-nowrap border border-[#c6c9ce] bg-[#e7e9ec] px-2 py-1 text-[11px] font-semibold text-[#4a5563]",
                        activeFormTab === tab && "bg-white text-[#1f2935]",
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-3" key={selectedRecord?.id}>
                {activeFormTab !== "GENERAL" ? (
                  <div className="rounded border border-dashed border-[#b9bec4] bg-[#f5f6f8] p-4 text-[12px] text-[#5f6772]">
                    {activeFormTab} tab is prepared as a placeholder. Main GRN entry fields are available in GENERAL.
                  </div>
                ) : (
                  <div className="grid gap-3 xl:grid-cols-[39%_61%]">
                    <div className="space-y-3">
                      <SectionBox title="Bills">
                        <div className="space-y-2">
                          <Field label="Stage" required>
                            <select className={cn(selectClass, "w-full")}>
                              <option>--</option>
                              <option>Initial Review</option>
                              <option>GRN Process</option>
                              <option>Approved</option>
                            </select>
                          </Field>

                          <Field label="Purchase Type" required>
                            <select className={cn(selectClass, "w-full")}>
                              <option>--</option>
                              <option>Regular Purchase</option>
                              <option>Import Purchase</option>
                              <option>IUT Purchase</option>
                            </select>
                          </Field>

                          <Field label="Purchase Category">
                            <select className={cn(selectClass, "w-full")}>
                              <option>--</option>
                              <option>Raw Material</option>
                              <option>Consumables</option>
                              <option>Service</option>
                            </select>
                          </Field>

                          <Field label="Project Name">
                            <Input className={inputClass} defaultValue={selectedRecord?.supplier ?? ""} />
                          </Field>

                          <Field label="Version No.">
                            <Input className={cn(inputClass, "max-w-[180px]")} defaultValue="" />
                          </Field>

                          <div className="pt-2">
                            <p className="mb-1 border-b border-dashed border-[#c2c5ca] pb-1 text-[11px] font-semibold text-[#2b3640]">
                              Priority Details:
                            </p>
                            <div className="grid gap-1 sm:grid-cols-3">
                              <Field label="Need">
                                <select className={cn(selectClass, "w-full")}>
                                  <option>Immediate</option>
                                  <option>Planned</option>
                                  <option>Hold</option>
                                </select>
                              </Field>
                              <Field label="Priority" required>
                                <select className={cn(selectClass, "w-full")}>
                                  <option>Cold</option>
                                  <option>Warm</option>
                                  <option>Hot</option>
                                </select>
                              </Field>
                              <Field label="Priority Level">
                                <select className={cn(selectClass, "w-full")}>
                                  <option>- -</option>
                                  <option>Low</option>
                                  <option>Medium</option>
                                  <option>High</option>
                                </select>
                              </Field>
                            </div>
                          </div>
                        </div>
                      </SectionBox>

                      <SectionBox title="Requirement">
                        <div className="space-y-2">
                          <Field label="Required Date">
                            <Input className={cn(inputClass, "max-w-[180px]")} type="date" defaultValue={today} />
                          </Field>

                          <p className="text-[12px] font-semibold text-[#cc1b1b]">Required</p>

                          <Field label="Request Department">
                            <Input className={cn(inputClass, "max-w-[220px]")} defaultValue="Stores" />
                          </Field>

                          <Field label="Required Time">
                            <div className="grid grid-cols-2 gap-2">
                              <select className={cn(selectClass, "w-full")}>
                                <option>--Start--</option>
                                <option>08:00</option>
                                <option>09:00</option>
                                <option>10:00</option>
                              </select>
                              <select className={cn(selectClass, "w-full")}>
                                <option>--End--</option>
                                <option>15:00</option>
                                <option>16:00</option>
                                <option>17:00</option>
                              </select>
                            </div>
                          </Field>

                          <Field label="Required Reason">
                            <Textarea className={textareaClass} />
                          </Field>
                        </div>
                      </SectionBox>
                    </div>

                    <div className="space-y-3">
                      <SectionBox title="Supplier Information">
                        <div className="space-y-3">
                          <Field label="Search as you type to search from your contacts">
                            <Input className={cn(inputClass, "max-w-[260px]")} />
                          </Field>

                          <div className="border-t border-dashed border-[#ced2d6] pt-2">
                            <Field label="Different bill from: (Show / Hide)">
                              <Input className={cn(inputClass, "max-w-[320px]")} />
                            </Field>
                          </div>

                          <div className="border-t border-dashed border-[#ced2d6] pt-2">
                            <Field label="Different Ship to: (Show / Hide)">
                              <Input className={cn(inputClass, "max-w-[320px]")} />
                            </Field>
                          </div>

                          <div className="border-t border-dashed border-[#ced2d6] pt-2">
                            <Field label="Different Ship from: (Show / Hide)">
                              <Input className={cn(inputClass, "max-w-[320px]")} />
                            </Field>
                          </div>

                          <Field label="Lead Source" required>
                            <select className={cn(selectClass, "max-w-[260px] w-full")}>
                              <option>--</option>
                              <option>Reference</option>
                              <option>Website</option>
                              <option>Internal</option>
                            </select>
                          </Field>

                          <Field label="Purchase Contact" required>
                            <div className="flex gap-2">
                              <select className={cn(selectClass, "w-full max-w-[260px]")}>
                                <option>- Sale Contacts -</option>
                                <option>Audit,</option>
                                <option>Stores Team</option>
                              </select>
                              <button
                                type="button"
                                className="h-7 w-7 border border-[#b8bcc2] bg-[#f8f8f8] text-sm font-semibold text-[#445160]"
                              >
                                +
                              </button>
                            </div>
                          </Field>
                        </div>
                      </SectionBox>

                      <SectionBox title="Details">
                        <div className="space-y-2">
                          <Field label="Internal Ref ID">
                            <Input className={cn(inputClass, "max-w-[240px]")} />
                          </Field>
                          <Field label="Invoice Ref ID">
                            <Input className={cn(inputClass, "max-w-[240px]")} />
                          </Field>
                          <Field label="Tolerance">
                            <select className={cn(selectClass, "max-w-[240px] w-full")}>
                              <option>--</option>
                              <option>Low</option>
                              <option>Normal</option>
                              <option>High</option>
                            </select>
                          </Field>
                          <Field label="Capex">
                            <select className={cn(selectClass, "max-w-[240px] w-full")}>
                              <option>--</option>
                              <option>Yes</option>
                              <option>No</option>
                            </select>
                          </Field>
                          <Field label="TL Code">
                            <Input className={cn(inputClass, "max-w-[240px]")} />
                          </Field>
                          <Field label="Delivery Challan Type">
                            <select className={cn(selectClass, "max-w-[240px] w-full")}>
                              <option>--</option>
                              <option>Original</option>
                              <option>Duplicate</option>
                            </select>
                          </Field>
                          <Field label="Indent Number & Date">
                            <Textarea className={cn(textareaClass, "max-w-[340px]")} />
                          </Field>
                          <Field label="Indent Receiving Date & Time">
                            <Input className={cn(inputClass, "max-w-[240px]")} type="datetime-local" />
                          </Field>
                          <Field label="Material Received Date & Time">
                            <Input className={cn(inputClass, "max-w-[240px]")} type="datetime-local" />
                          </Field>
                          <Field label="Requisitioner Name">
                            <Textarea className={cn(textareaClass, "max-w-[340px]")} />
                          </Field>
                          <Field label="Gate Entry Book No.">
                            <Input className={cn(inputClass, "max-w-[240px]")} defaultValue={selectedRecord?.gateEntryNo} />
                          </Field>
                          <Field label="Gate Entry Book Date">
                            <Input className={cn(inputClass, "max-w-[240px]")} type="date" defaultValue={selectedRecord?.date} />
                          </Field>
                          <Field label="Declaration">
                            <Textarea className={cn(textareaClass, "max-w-[340px]")} />
                          </Field>
                          <Field label="Total In Words (Custom Invoice)">
                            <Input className={cn(inputClass, "max-w-[240px]")} />
                          </Field>
                          <Field label="Zigma Grn No">
                            <Input className={cn(inputClass, "max-w-[240px]")} defaultValue={selectedRecord?.grnNo} />
                          </Field>
                          <Field label="Zigma Grn Date">
                            <Input className={cn(inputClass, "max-w-[240px]")} type="date" defaultValue={today} />
                          </Field>
                          <Field
                            label="Presales Reff"
                            hint="(Type '.' or ';' to see all or search to find a presales #)"
                          >
                            <Input className={cn(inputClass, "max-w-[340px]")} />
                          </Field>
                          <Field label="PO Ref#">
                            <Input className={cn(inputClass, "max-w-[260px]")} defaultValue={selectedRecord?.poRef} />
                          </Field>
                          <Field label="Sales Order / Invoice Title">
                            <Input className={cn(inputClass, "max-w-[260px]")} />
                          </Field>
                          <Field label="Default Disc%">
                            <Input className={cn(inputClass, "max-w-[100px]")} />
                          </Field>
                          <Field label="Movement Description">
                            <select className={cn(selectClass, "max-w-[280px] w-full")}>
                              <option>- Choose -</option>
                              <option>Goods Receipt</option>
                              <option>Purchase Return</option>
                            </select>
                          </Field>
                          <Field label="Destination">
                            <Input className={cn(inputClass, "max-w-[340px]")} defaultValue="Main Warehouse" />
                          </Field>
                          <Field label="Scan Qty">
                            <Input className={cn(inputClass, "max-w-[100px]")} type="number" min="0" />
                          </Field>
                          <Field label="Document Contact (Name, email)">
                            <Textarea className={cn(textareaClass, "max-w-[360px]")} defaultValue="Audit," />
                          </Field>
                          <Field label="Base Order ID">
                            <Input className={cn(inputClass, "max-w-[240px]")} defaultValue={selectedRecord?.id} />
                          </Field>
                          <Field label="Base Customer ID">
                            <Input className={cn(inputClass, "max-w-[240px]")} />
                          </Field>
                          <Field label="Base Customer Name">
                            <Input className={cn(inputClass, "max-w-[240px]")} defaultValue={selectedRecord?.supplier} />
                          </Field>
                          <Field label="Base Order Date">
                            <Input className={cn(inputClass, "max-w-[240px]")} type="date" defaultValue={selectedRecord?.date} />
                          </Field>
                          <Field label="Activity ID">
                            <Input className={cn(inputClass, "max-w-[240px]")} />
                          </Field>
                        </div>
                      </SectionBox>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModuleFormFieldsReference moduleId="purchasesaledoc" />
    </div>
  );
};

export default PurchasesInwardsPage;
