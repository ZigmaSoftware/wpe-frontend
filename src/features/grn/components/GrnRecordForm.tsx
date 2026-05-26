import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, Building2, Calculator, ClipboardList, FileText, Layers3, Loader2, Plus, ReceiptText, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultGrnValues,
  defaultItem,
  documentFieldConfigs,
  grnFormTabs,
  grnSchema,
  itemFieldConfigs,
  readValue,
  requirementFieldConfigs,
  supplierFieldConfigs,
  type GrnFormTab,
  type GrnFormValues,
  valueFieldConfigs,
} from "@/features/grn/grnShared";
import GrnSectionCard from "./GrnSectionCard";
import GrnTabs from "./GrnTabs";
import {
  grnFieldLabelClassName,
  grnHelperTextClassName,
  grnInputClassName,
  grnMetricCardClassName,
} from "./grnPageStyles";

type GrnRecordFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  onSubmit: (values: GrnFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialValues?: GrnFormValues;
};

const cardIcons = {
  document: FileText,
  requirement: ClipboardList,
  supplier: Building2,
  items: Boxes,
  totals: Calculator,
} as const;

const renderInput = (
  field: {
    value: string;
    onChange: (...event: unknown[]) => void;
    onBlur: () => void;
    name: string;
    ref: (instance: HTMLInputElement | HTMLTextAreaElement | null) => void;
  },
  kind: "text" | "date" | "textarea" = "text",
) => {
  if (kind === "textarea") {
    return <Textarea {...field} rows={3} className={`resize-none ${grnInputClassName}`} />;
  }

  return <Input {...field} type={kind === "date" ? "date" : "text"} className={grnInputClassName} />;
};

const GrnRecordForm = ({
  title,
  subtitle,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialValues,
}: GrnRecordFormProps) => {
  const [activeTab, setActiveTab] = useState<GrnFormTab>("document");
  const form = useForm<GrnFormValues>({
    resolver: zodResolver(grnSchema),
    defaultValues: initialValues ?? defaultGrnValues,
  });
  const itemsFieldArray = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    form.reset(initialValues ?? defaultGrnValues);
  }, [form, initialValues]);

  const grnNumber = form.watch("document_details.grn_no");
  const supplierName = form.watch("supplier_details.trade_name");
  const totalAfterTax = form.watch("value_details.total_after_tax");
  const lineItems = form.watch("items");
  const activeTabLabel = useMemo(
    () => grnFormTabs.find((tab) => tab.value === activeTab)?.label ?? "Document",
    [activeTab],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_28px_70px_-50px_rgba(15,23,42,0.38)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col overflow-hidden bg-[#eef3f9]">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as GrnFormTab)} className="flex h-full flex-col">
            <div className="border-b border-slate-200/80 bg-white">
              <div className="px-5 py-4 text-left lg:px-6 lg:py-5">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                      <span className="inline-flex items-center rounded-full border border-[#ffd3b5] bg-[#fff4eb] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ff6b00]">
                        GRN Workspace
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span>Receipt Control</span>
                        <Layers3 className="h-3 w-3" />
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span>Commercial Intake</span>
                        <Layers3 className="h-3 w-3" />
                      </span>
                      <span>Inventory Posting</span>
                    </div>

                    <div className="space-y-1.5">
                      <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-slate-950 lg:text-[1.9rem]">
                        {title}
                      </h1>
                      <p className="max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[#059669]">
                        <ReceiptText className="h-3.5 w-3.5" />
                        Exact nested payload preserved
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7ed] px-2.5 py-1 text-[#f97316]">
                        <Sparkles className="h-3.5 w-3.5" />
                        All visible receipt fields remain editable
                      </span>
                      {form.formState.isDirty ? (
                        <span className="inline-flex items-center rounded-full bg-[#fff8e6] px-2.5 py-1 text-[#b7791f]">
                          Draft changes in progress
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <div className={grnMetricCardClassName}>
                      <div className={grnFieldLabelClassName}>GRN No</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{readValue(grnNumber)}</div>
                    </div>
                    <div className={grnMetricCardClassName}>
                      <div className={grnFieldLabelClassName}>Current Tab</div>
                      <div className="mt-2.5 inline-flex rounded-full border border-[#bfd3ff] bg-[#eef4ff] px-2.5 py-1 text-xs font-semibold text-[#2d6cdf]">
                        {activeTabLabel}
                      </div>
                    </div>
                    <div className={grnMetricCardClassName}>
                      <div className={grnFieldLabelClassName}>Summary</div>
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <div className="truncate font-semibold text-slate-900">{readValue(supplierName)}</div>
                        <div>{lineItems.length} line item(s)</div>
                        <div>Total: {readValue(totalAfterTax)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-0 lg:px-6">
                <GrnTabs value={activeTab} onValueChange={setActiveTab} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
              <TabsContent value="document" className="mt-0 outline-none">
                <GrnSectionCard
                  title="Document Details"
                  description="Receipt reference, invoice linkage, gate entry, and date controls."
                  tone="amber"
                  icon={cardIcons.document}
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {documentFieldConfigs.map((config) => (
                      <FormField
                        key={config.name}
                        control={form.control}
                        name={`document_details.${config.name}` as const}
                        render={({ field }) => (
                          <FormItem className={config.fullWidth ? "xl:col-span-3" : undefined}>
                            <FormLabel>{config.label}</FormLabel>
                            <FormControl>{renderInput(field, config.kind)}</FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </GrnSectionCard>
              </TabsContent>

              <TabsContent value="requirement" className="mt-0 outline-none">
                <GrnSectionCard
                  title="Requirement Details"
                  description="Request ownership, department context, and inward reason tracking."
                  tone="blue"
                  icon={cardIcons.requirement}
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {requirementFieldConfigs.map((config) => (
                      <FormField
                        key={config.name}
                        control={form.control}
                        name={`document_requirement_details.${config.name}` as const}
                        render={({ field }) => (
                          <FormItem className={config.fullWidth ? "xl:col-span-3" : undefined}>
                            <FormLabel>{config.label}</FormLabel>
                            <FormControl>{renderInput(field, config.kind)}</FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </GrnSectionCard>
              </TabsContent>

              <TabsContent value="supplier" className="mt-0 outline-none">
                <GrnSectionCard
                  title="Supplier Details"
                  description="Supplier identity, commercial contact, and destination address information."
                  tone="violet"
                  icon={cardIcons.supplier}
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {supplierFieldConfigs.map((config) => (
                      <FormField
                        key={config.name}
                        control={form.control}
                        name={`supplier_details.${config.name}` as const}
                        render={({ field }) => (
                          <FormItem className={config.fullWidth ? "xl:col-span-3" : undefined}>
                            <FormLabel>{config.label}</FormLabel>
                            <FormControl>{renderInput(field, config.kind)}</FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </GrnSectionCard>
              </TabsContent>

              <TabsContent value="items" className="mt-0 outline-none">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Item Lines</h2>
                      <p className="text-sm text-slate-500">Manage the imported product lines, inward quantities, and valuation details.</p>
                    </div>
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => itemsFieldArray.append(defaultItem)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Line
                    </Button>
                  </div>

                  {itemsFieldArray.fields.map((itemField, index) => (
                    <GrnSectionCard
                      key={itemField.id}
                      title={`Item Line ${index + 1}`}
                      description="Line-level material identity, inward handling, and tax values."
                      tone="gold"
                      icon={cardIcons.items}
                      action={
                        itemsFieldArray.fields.length > 1 ? (
                          <Button type="button" variant="ghost" size="icon" onClick={() => itemsFieldArray.remove(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null
                      }
                    >
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {itemFieldConfigs.map((config) => (
                          <FormField
                            key={`${itemField.id}-${config.name}`}
                            control={form.control}
                            name={`items.${index}.${config.name}` as const}
                            render={({ field }) => (
                              <FormItem className={config.fullWidth ? "xl:col-span-3" : undefined}>
                                <FormLabel>{config.label}</FormLabel>
                                <FormControl>{renderInput(field, config.kind)}</FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </GrnSectionCard>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="totals" className="mt-0 outline-none">
                <GrnSectionCard
                  title="Commercial Totals"
                  description="Freight, tax, and receipt valuation totals to post with the GRN."
                  tone="emerald"
                  icon={cardIcons.totals}
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {valueFieldConfigs.map((config) => (
                      <FormField
                        key={config.name}
                        control={form.control}
                        name={`value_details.${config.name}` as const}
                        render={({ field }) => (
                          <FormItem className={config.fullWidth ? "xl:col-span-3" : undefined}>
                            <FormLabel>{config.label}</FormLabel>
                            <FormControl>{renderInput(field, config.kind)}</FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </GrnSectionCard>
              </TabsContent>
            </div>

            <div className="border-t border-slate-200/80 bg-white/95 px-5 py-3 backdrop-blur lg:px-6">
              <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                <div className={grnHelperTextClassName}>
                  All fields remain editable in local form state until the final GRN submission is confirmed.
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 rounded-full bg-[linear-gradient(135deg,#ff8f1f_0%,#ff6b00_100%)] px-5 text-white shadow-[0_12px_24px_-16px_rgba(255,107,0,0.9)] hover:opacity-95"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {submitLabel}...
                      </>
                    ) : (
                      submitLabel
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Tabs>
        </form>
      </Form>
    </div>
  );
};

export default GrnRecordForm;
