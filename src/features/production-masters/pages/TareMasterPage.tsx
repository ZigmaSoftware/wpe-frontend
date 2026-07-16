import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import { tareMasterSchema, type TareMasterFormValues } from "@/features/production-masters/schemas";

const STAGE_OPTIONS: Array<{ value: TareMasterFormValues["stage"]; label: string }> = [
  { value: "AD", label: "Additive (AD)" },
  { value: "BL", label: "Blending (BL)" },
  { value: "GL", label: "Granulation (GL)" },
  { value: "PR", label: "Production (PR)" },
];

const defaultValues: TareMasterFormValues = {
  code: "",
  name: "",
  description: "",
  stage: "AD",
  tare_weight: 0,
  uom: "KG",
  is_active: true,
};

const TareMasterPage = () => {
  return (
    <CodeMasterPage
      title="Tare Master"
      description="Set the container tare weight shown and subtracted for each production stage (Additive, Blending, Granulation, Production)."
      queryKey="production-tare-masters"
      api={productionMastersApi.tareMasters}
      schema={tareMasterSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        description: record.description ?? "",
        stage: record.stage,
        tare_weight: Number(record.tare_weight ?? 0),
        uom: record.uom,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        description: values.description,
        stage: values.stage,
        tare_weight: values.tare_weight,
        uom: values.uom,
        is_active: values.is_active,
      })}
      codeLabel="Tare Code*"
      nameLabel="Tare Name*"
      namePlaceholder="e.g. Additive Weighing Tray Tare"
      showDescription={false}
      createLabel="Add Tare"
      createButtonLabel="Create Tare"
      allowDelete={false}
      extraColumns={[
        {
          key: "stage_display",
          title: "Stage",
          render: (record) => record.stage_display || record.stage,
        },
        {
          key: "tare_weight",
          title: "Tare Weight",
          render: (record) => `${record.tare_weight} ${record.uom}`,
        },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="tare_weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tare Weight (KG)*</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.001" min="0" value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    />
  );
};

export default TareMasterPage;
