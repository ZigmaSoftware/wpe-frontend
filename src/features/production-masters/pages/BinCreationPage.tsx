import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import ProductionEnumBadge from "@/features/production-masters/components/ProductionEnumBadge";
import { binCreationSchema, type BinCreationFormValues } from "@/features/production-masters/schemas";

const defaultValues: BinCreationFormValues = {
  code: "",
  name: "",
  description: "",
  current_status: "",
  is_active: true,
};

const BinCreationPage = () => {
  return (
    <CodeMasterPage
      title="Bin Creation"
      description="Manage bins used for production material handling."
      queryKey="production-bin-creations"
      api={productionMastersApi.binCreations}
      schema={binCreationSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        current_status: record.current_status ?? "",
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        current_status: values.current_status || "",
        is_active: values.is_active,
      })}
      codeLabel="Bin Code*"
      nameLabel="Bin Name*"
      namePlaceholder="Enter bin name"
      showDescription={false}
      createLabel="Add Bin"
      createButtonLabel="Create Bin"
      allowDelete={false}
      extraColumns={[
        {
          key: "current_status",
          title: "Current Status",
          render: (record) => <ProductionEnumBadge value={record.current_status} />,
        },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="current_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Status</FormLabel>
                <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                    <SelectItem value="HOLD">Hold</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    />
  );
};

export default BinCreationPage;
