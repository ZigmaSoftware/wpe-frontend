import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { LookupItem } from "@/features/wpe-masters/types";
import type { ProductTypeSubtypeFormValues } from "@/features/wpe-masters/schemas/productTypes";


type ProductTypeSubtypeFormProps = {
  categoryLocked?: boolean;
  categoryOptions: LookupItem[];
  codePreview: string;
  form: UseFormReturn<ProductTypeSubtypeFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: ProductTypeSubtypeFormValues) => Promise<void>;
};


const ProductTypeSubtypeForm = ({
  categoryLocked = false,
  categoryOptions,
  codePreview,
  form,
  isSubmitting,
  submitLabel,
  onSubmit,
}: ProductTypeSubtypeFormProps) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormItem>
        <FormLabel>Sub Category Code*</FormLabel>
        <FormControl>
          <Input value={codePreview} readOnly placeholder="Generating..." className="bg-muted/40 font-mono" />
        </FormControl>
      </FormItem>
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Item Category*</FormLabel>
            <Select
              value={field.value ? String(field.value) : undefined}
              onValueChange={(value) => field.onChange(Number(value))}
              disabled={categoryLocked}
            >
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
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sub Category Name*</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter item sub category name" />
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
            <FormLabel>Details</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} placeholder="Add supporting details for downstream users." />
            </FormControl>
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
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  </Form>
);


export default ProductTypeSubtypeForm;
