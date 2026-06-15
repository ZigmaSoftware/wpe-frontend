import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, Building2, Calculator, ClipboardList, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultGrnValues,
  defaultItem,
  documentFieldConfigs,
  grnSchema,
  itemFieldConfigs,
  requirementFieldConfigs,
  supplierFieldConfigs,
  type GrnFormTab,
  type GrnFormValues,
  valueFieldConfigs,
} from "@/features/grn/grnShared";
import GrnSectionCard from "./GrnSectionCard";
import GrnTabs from "./GrnTabs";
import { grnInputClassName } from "./grnPageStyles";

type GrnRecordFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  onSubmit: (values: GrnFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialValues?: GrnFormValues;
  headerActions?: ReactNode | ((state: {
    isDirty: boolean;
    validateFields: (names?: FieldPath<GrnFormValues> | FieldPath<GrnFormValues>[]) => Promise<boolean>;
    getValue: (name: FieldPath<GrnFormValues>) => unknown;
    setFieldError: (name: FieldPath<GrnFormValues>, message: string) => void;
    clearFieldError: (name: FieldPath<GrnFormValues>) => void;
    setActiveTab: (tab: GrnFormTab) => void;
  }) => ReactNode);
  headerActionsPlacement?: "end" | "center" | "side-center";
  requiredDocumentFields?: Array<keyof GrnFormValues["document_details"]>;
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
  required = false,
  className?: string,
  options?: {
    max?: string;
  },
) => {
  if (kind === "textarea") {
    return <Textarea {...field} rows={3} required={required} className={`resize-none ${grnInputClassName} ${className ?? ""}`} />;
  }

  return (
    <Input
      {...field}
      type={kind === "date" ? "date" : "text"}
      required={required}
      max={kind === "date" ? options?.max : undefined}
      className={`${grnInputClassName} ${className ?? ""}`}
    />
  );
};

const GrnRecordForm = ({
  title,
  subtitle,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialValues,
  headerActions,
  headerActionsPlacement = "end",
  requiredDocumentFields = [],
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

  const resolvedHeaderActions =
    typeof headerActions === "function"
      ? headerActions({
          isDirty: form.formState.isDirty,
          validateFields: (names) => form.trigger(names),
          getValue: (name) => form.getValues(name),
          setFieldError: (name, message) => form.setError(name, { type: "manual", message }),
          clearFieldError: (name) => form.clearErrors(name),
          setActiveTab,
        })
      : headerActions;
  const requiredDocumentFieldNames = new Set(requiredDocumentFields);
  const renderCenteredHeaderActions = headerActionsPlacement === "center" && resolvedHeaderActions;
  const renderSideCenteredHeaderActions = headerActionsPlacement === "side-center" && resolvedHeaderActions;
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const todayDateInputValue = today.toISOString().slice(0, 10);

  return (
    <div className="flex min-h-full flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-full flex-col bg-[#eef3f9]">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as GrnFormTab)}
            className="flex min-h-full flex-col"
          >
            <div className="border-b border-slate-200/80 bg-white">
              <div className="px-4 py-3 text-left sm:px-5 lg:px-6 lg:py-3.5">
                <div className="space-y-3">
                  <div
                    className={`flex flex-wrap gap-3 ${
                      renderCenteredHeaderActions
                        ? "items-start"
                        : renderSideCenteredHeaderActions
                          ? "items-center justify-between"
                          : "items-start justify-between"
                    }`}
                  >
                    <div className="space-y-1">
                      <h1 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.02em] text-slate-950 sm:text-[1.5rem]">
                        {title}
                      </h1>
                      <p className="text-sm text-slate-500">{subtitle}</p>
                    </div>
                    {!renderCenteredHeaderActions && resolvedHeaderActions ? (
                      <div className="flex flex-wrap items-center gap-2">{resolvedHeaderActions}</div>
                    ) : null}
                  </div>
                  {renderCenteredHeaderActions ? (
                    <div className="flex flex-wrap items-center justify-center gap-2">{resolvedHeaderActions}</div>
                  ) : null}
                </div>
              </div>

              <div className="px-5 pb-0 lg:px-6">
                <GrnTabs value={activeTab} onValueChange={setActiveTab} />
              </div>
            </div>

            <div className="flex-1 px-4 py-4 sm:px-5 lg:px-6">
              <TabsContent value="document" className="mt-0 outline-none">
                <GrnSectionCard
                  title="Document Details"
                  description="Receipt reference, invoice linkage, gate entry, and date controls."
                  tone="amber"
                  icon={cardIcons.document}
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {documentFieldConfigs.map((config) => (
                      (() => {
                        const isRequired = requiredDocumentFieldNames.has(config.name);
                        return (
                      <FormField
                        key={config.name}
                        control={form.control}
                        name={`document_details.${config.name}` as const}
                        render={({ field, fieldState }) => {
                          const fieldName = `document_details.${config.name}` as const;
                          return (
                          <FormItem className={config.fullWidth ? "xl:col-span-3" : undefined}>
                            <FormLabel>
                              {config.label}
                              {isRequired ? <span className="text-destructive"> *</span> : null}
                            </FormLabel>
                            <FormControl>
                              {renderInput(
                                {
                                  ...field,
                                  onChange: (...event) => {
                                    field.onChange(...event);
                                    if (!isRequired) {
                                      return;
                                    }
                                    const nextValue =
                                      typeof event[0] === "string"
                                        ? event[0]
                                        : (event[0] as { target?: { value?: string } } | undefined)?.target?.value ?? "";
                                    if (String(nextValue).trim()) {
                                      form.clearErrors(fieldName);
                                    }
                                  },
                                },
                                config.kind,
                                isRequired,
                                fieldState.error
                                  ? "border-destructive bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive/20"
                                  : undefined,
                                config.name === "gateentry_bookdate"
                                  ? {
                                      max: todayDateInputValue,
                                    }
                                  : undefined,
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                          );
                        }}
                      />
                        );
                      })()
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
              <div className="flex justify-end">
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
