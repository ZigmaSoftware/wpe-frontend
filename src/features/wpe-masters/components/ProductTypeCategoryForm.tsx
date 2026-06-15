import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ProductTypeCategoryFormValues } from "@/features/wpe-masters/schemas/productTypes";


type ProductTypeCategoryFormProps = {
  codePreview: string;
  form: UseFormReturn<ProductTypeCategoryFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: ProductTypeCategoryFormValues) => Promise<void>;
};


const ProductTypeCategoryForm = ({
  codePreview,
  form,
  isSubmitting,
  submitLabel,
  onSubmit,
}: ProductTypeCategoryFormProps) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormItem>
        <FormLabel>Category Code</FormLabel>
        <FormControl>
          <Input value={codePreview} readOnly placeholder="Generating..." className="bg-muted/40 font-mono" />
        </FormControl>
      </FormItem>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category Name*</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter item category name" />
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
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} placeholder="Add a clear description for downstream users." />
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


export default ProductTypeCategoryForm;
