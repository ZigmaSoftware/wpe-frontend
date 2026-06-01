import { useQuery } from "@tanstack/react-query";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deviceLabelMastersApi } from "@/features/device-label-masters/api/deviceLabelMastersApi";
import DeviceLabelEnumBadge from "@/features/device-label-masters/components/DeviceLabelEnumBadge";
import {
  qrLabelTemplateSchema,
  type QRLabelTemplateFormValues,
} from "@/features/device-label-masters/schemas";
import type { QRLabelTemplateWritePayload } from "@/features/device-label-masters/types";
import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";

const defaultValues: QRLabelTemplateFormValues = {
  code: "",
  name: "",
  label_type: "",
  width: undefined,
  height: undefined,
  qr_data_format: "",
  printer: 0,
  is_active: true,
};

const labelTypeLabel = (value: string) =>
  ({
    BIN: "Bin",
    BAG: "Bag",
    PRODUCT: "Product",
    REGRIND: "Regrind",
  })[value] ?? value;

const dataFormatLabel = (value: string) =>
  ({
    JSON: "JSON",
    TEXT: "Text",
  })[value] ?? value;

const QRLabelTemplatePage = () => {
  const printerQuery = useQuery({
    queryKey: ["device-label-masters", "printer-creations", "lookup"],
    queryFn: deviceLabelMastersApi.printerCreations.lookup,
  });

  return (
    <CodeMasterPage
      title="QR Label Template"
      description="Configure QR label templates for bins, bags, products, and regrind labels."
      queryKey="qr-label-templates"
      api={deviceLabelMastersApi.qrLabelTemplates}
      schema={qrLabelTemplateSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        label_type: record.label_type,
        width: record.width ? Number(record.width) : undefined,
        height: record.height ? Number(record.height) : undefined,
        qr_data_format: record.qr_data_format,
        printer: record.printer,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        label_type: values.label_type as QRLabelTemplateWritePayload["label_type"],
        width: values.width ?? null,
        height: values.height ?? null,
        qr_data_format: (values.qr_data_format || "JSON") as QRLabelTemplateWritePayload["qr_data_format"],
        printer: values.printer,
        is_active: values.is_active,
      })}
      codeLabel="Template Code*"
      nameLabel="Template Name*"
      namePlaceholder="Enter template name"
      showDescription={false}
      createLabel="Add QR Label Template"
      createButtonLabel="Create QR Label Template"
      createTitle="Create QR Label Template"
      editTitle="Edit QR Label Template"
      extraColumns={[
        {
          key: "label_type",
          title: "Label Type",
          render: (record) => <DeviceLabelEnumBadge value={record.label_type} label={labelTypeLabel(record.label_type)} />,
        },
        { key: "printer", title: "Printer", render: (record) => record.printer_name || "-" },
        {
          key: "qr_data_format",
          title: "QR Data Format",
          render: (record) => <DeviceLabelEnumBadge value={record.qr_data_format} label={dataFormatLabel(record.qr_data_format)} />,
        },
      ]}
      renderNameSecondary={(record) =>
        record.width && record.height ? `${record.width} x ${record.height}` : record.printer_code || null
      }
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="label_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label Type*</FormLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Label Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BIN">Bin</SelectItem>
                    <SelectItem value="BAG">Bag</SelectItem>
                    <SelectItem value="PRODUCT">Product</SelectItem>
                    <SelectItem value="REGRIND">Regrind</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="printer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Printer*</FormLabel>
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Printer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(printerQuery.data ?? []).map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {option.code ? `${option.name} (${option.code})` : option.name}
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
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="qr_data_format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>QR Data Format</FormLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select QR Data Format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="JSON">JSON</SelectItem>
                    <SelectItem value="TEXT">Text</SelectItem>
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

export default QRLabelTemplatePage;
