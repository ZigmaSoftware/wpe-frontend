import { Boxes, Building2, Calculator, ClipboardList, FileText } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { grnFormTabs, type GrnFormTab } from "@/features/grn/grnShared";

type GrnTabsProps = {
  value: GrnFormTab;
  onValueChange: (value: GrnFormTab) => void;
};

const tabIcons = {
  document: FileText,
  requirement: ClipboardList,
  supplier: Building2,
  items: Boxes,
  totals: Calculator,
} as const;

const GrnTabs = ({ value, onValueChange }: GrnTabsProps) => (
  <TabsList className="h-auto w-full justify-start gap-0.5 overflow-x-auto rounded-none bg-transparent p-0">
    {grnFormTabs.map((tab) => {
      const Icon = tabIcons[tab.value];

      return (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          onClick={() => onValueChange(tab.value)}
          className={cn(
            "relative min-w-fit rounded-none border-b-2 border-transparent px-3 py-2.5 text-[13px] font-semibold text-slate-500 shadow-none transition-colors hover:text-slate-800 data-[state=active]:border-[#ff6b00] data-[state=active]:bg-transparent data-[state=active]:text-[#ff6b00] data-[state=active]:shadow-none",
            value === tab.value && "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-[#ff6b00]",
          )}
        >
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </span>
        </TabsTrigger>
      );
    })}
  </TabsList>
);

export default GrnTabs;
