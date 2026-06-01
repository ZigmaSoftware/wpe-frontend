import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deviceLabelMastersApi } from "@/features/device-label-masters/api/deviceLabelMastersApi";
import DeviceLabelEnumBadge from "@/features/device-label-masters/components/DeviceLabelEnumBadge";
import {
  serialPortConfigurationSchema,
  type SerialPortConfigurationFormValues,
} from "@/features/device-label-masters/schemas";
import type { SerialPortConfigurationWritePayload } from "@/features/device-label-masters/types";
import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";

const defaultValues: SerialPortConfigurationFormValues = {
  code: "",
  name: "",
  port_name: "/dev/ttyS1",
  baud_rate: 9600,
  parity: "NONE",
  data_bits: 8,
  stop_bits: 1,
  timeout: undefined,
  read_format: "ASCII",
  is_active: true,
};

const SerialPortConfigurationPage = () => (
  <CodeMasterPage
    title="Serial Port Configuration"
    description="Maintain serial communication settings for connected hardware devices."
    queryKey="serial-port-configurations"
    api={deviceLabelMastersApi.serialPortConfigurations}
    schema={serialPortConfigurationSchema}
    defaultValues={defaultValues}
    mapRecordToForm={(record) => ({
      code: record.code ?? "",
      name: record.name,
      port_name: record.port_name || "/dev/ttyS1",
      baud_rate: Number(record.baud_rate ?? 9600),
      parity: record.parity,
      data_bits: Number(record.data_bits ?? 8),
      stop_bits: Number(record.stop_bits ?? 1),
      timeout: record.timeout ?? undefined,
      read_format: record.read_format,
      is_active: record.is_active,
    })}
    mapFormToPayload={(values) => ({
      name: values.name,
      port_name: values.port_name,
      baud_rate: values.baud_rate,
      parity: values.parity,
      data_bits: values.data_bits,
      stop_bits: values.stop_bits,
      timeout: values.timeout ?? null,
      read_format: values.read_format,
      is_active: values.is_active,
    } satisfies SerialPortConfigurationWritePayload)}
    codeLabel="Config Code*"
    nameLabel="Device Name*"
    namePlaceholder="Enter device name"
    showDescription={false}
    createLabel="Add Serial Port Configuration"
    createButtonLabel="Create Serial Port Configuration"
    createTitle="Create Serial Port Configuration"
    editTitle="Edit Serial Port Configuration"
    extraColumns={[
      { key: "port_name", title: "Port Name", render: (record) => record.port_name || "-" },
      {
        key: "read_format",
        title: "Read Format",
        render: (record) => <DeviceLabelEnumBadge value={record.read_format} />,
      },
      {
        key: "baud_rate",
        title: "Baud Rate",
        render: (record) => record.baud_rate || "-",
      },
    ]}
    renderExtras={({ form }) => (
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="port_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Port Name</FormLabel>
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Port Name" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="/dev/ttyS1">/dev/ttyS1</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="baud_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Baud Rate</FormLabel>
              <FormControl>
                <Input type="number" value={field.value ?? ""} onChange={(event) => field.onChange(Number(event.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parity</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Parity" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="data_bits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Bits</FormLabel>
              <FormControl>
                <Input type="number" value={field.value ?? ""} onChange={(event) => field.onChange(Number(event.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stop_bits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stop Bits</FormLabel>
              <FormControl>
                <Input type="number" value={field.value ?? ""} onChange={(event) => field.onChange(Number(event.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timeout</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                  placeholder="Enter timeout in seconds"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="read_format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Read Format</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Read Format" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ASCII">ASCII</SelectItem>
                  <SelectItem value="HEX">HEX</SelectItem>
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

export default SerialPortConfigurationPage;
