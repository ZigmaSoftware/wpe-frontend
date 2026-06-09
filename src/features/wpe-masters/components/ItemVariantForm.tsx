import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ItemMasterFormValues } from "@/features/wpe-masters/schemas/masters";
import type { LookupItem, ProductTypeSubtypeRecord } from "@/features/wpe-masters/types";

type ItemVariantFormProps = {
  categoryOptions: LookupItem[];
  subCategoryOptions: ProductTypeSubtypeRecord[];
  unitOptions: LookupItem[];
  codePreview: string;
  form: UseFormReturn<ItemMasterFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: ItemMasterFormValues) => Promise<void>;
};

const ItemVariantForm = ({
  categoryOptions,
  subCategoryOptions,
  unitOptions,
  codePreview,
  form,
  isSubmitting,
  submitLabel,
  onSubmit,
}: ItemVariantFormProps) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <FormItem>
        <FormLabel>Variant Code</FormLabel>
        <FormControl>
          <Input value={codePreview} readOnly placeholder="Generating..." className="bg-muted/40 font-mono" />
        </FormControl>
      </FormItem>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Category*</FormLabel>
              <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Item Category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sub_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Sub Category*</FormLabel>
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={!form.watch("category")}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Item Sub Category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subCategoryOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="item_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Variant Name*</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter item variant name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Specification / Description</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} placeholder="Capture the exact specification, mesh, size, or version details." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="uom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UOM*</FormLabel>
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={!unitOptions.length}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={unitOptions.length ? "Select UOM" : "No active UOM available"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {unitOptions.length ? (
                    unitOptions.map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {option.uom_code ? `${option.uom_code} - ` : ""}{option.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-500">No active UOM records found.</div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
              <FormLabel>Active Status*</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  </Form>
);

export default ItemVariantForm;
