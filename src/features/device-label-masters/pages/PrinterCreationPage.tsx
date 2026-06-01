import { useQuery } from "@tanstack/react-query";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deviceLabelMastersApi } from "@/features/device-label-masters/api/deviceLabelMastersApi";
import DeviceLabelEnumBadge from "@/features/device-label-masters/components/DeviceLabelEnumBadge";
import {
  printerCreationSchema,
  type PrinterCreationFormValues,
} from "@/features/device-label-masters/schemas";
import type { PrinterCreationWritePayload } from "@/features/device-label-masters/types";
import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";

const defaultValues: PrinterCreationFormValues = {
  code: "",
  name: "",
  printer_type: "",
  department: 0,
  connection_type: "",
  ip_address: "",
  port: undefined,
  paper_size: "LABEL",
  is_active: true,
};

const printerTypeLabel = (value: string) =>
  ({
    BARCODE: "Barcode",
    QR: "QR",
    STICKER: "Sticker",
  })[value] ?? value;

const connectionTypeLabel = (value: string) =>
  ({
    USB: "USB",
    NETWORK: "Network",
  })[value] ?? value;

const PrinterCreationPage = () => {
  const departmentQuery = useQuery({
    queryKey: ["wpe-masters", "departments", "lookup"],
    queryFn: wpeMastersApi.departments.lookup,
  });

  return (
    <CodeMasterPage
      title="Printer Creation"
      description="Manage barcode, QR, and sticker printers with department and connection details."
      queryKey="printer-creations"
      api={deviceLabelMastersApi.printerCreations}
      schema={printerCreationSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        printer_type: record.printer_type,
        department: record.department,
        connection_type: record.connection_type,
        ip_address: record.ip_address ?? "",
        port: record.port ?? undefined,
        paper_size: record.paper_size || "LABEL",
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        printer_type: values.printer_type as PrinterCreationWritePayload["printer_type"],
        department: values.department,
        connection_type: values.connection_type as PrinterCreationWritePayload["connection_type"],
        ip_address: values.ip_address || null,
        port: values.port ?? null,
        paper_size: values.paper_size || "LABEL",
        is_active: values.is_active,
      })}
      codeLabel="Printer Code*"
      nameLabel="Printer Name*"
      namePlaceholder="Enter printer name"
      showDescription={false}
      createLabel="Add Printer"
      createButtonLabel="Create Printer"
      createTitle="Create Printer"
      editTitle="Edit Printer"
      extraColumns={[
        {
          key: "printer_type",
          title: "Printer Type",
          render: (record) => <DeviceLabelEnumBadge value={record.printer_type} label={printerTypeLabel(record.printer_type)} />,
        },
        { key: "department", title: "Department", render: (record) => record.department_name || "-" },
        {
          key: "connection_type",
          title: "Connection Type",
          render: (record) => <DeviceLabelEnumBadge value={record.connection_type} label={connectionTypeLabel(record.connection_type)} />,
        },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="printer_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Printer Type*</FormLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Printer Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BARCODE">Barcode</SelectItem>
                    <SelectItem value="QR">QR</SelectItem>
                    <SelectItem value="STICKER">Sticker</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department*</FormLabel>
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(departmentQuery.data ?? []).map((option) => (
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
            name="connection_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Connection Type*</FormLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Connection Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USB">USB</SelectItem>
                    <SelectItem value="NETWORK">Network</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paper_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paper Size</FormLabel>
                <Select value={field.value || "LABEL"} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Paper Size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LABEL">Label</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ip_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IP Address</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Enter IP address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                    placeholder="Enter port"
                  />
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

export default PrinterCreationPage;
