import { useQuery } from "@tanstack/react-query";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deviceLabelMastersApi } from "@/features/device-label-masters/api/deviceLabelMastersApi";
import DeviceLabelEnumBadge from "@/features/device-label-masters/components/DeviceLabelEnumBadge";
import {
  weighmentScaleSchema,
  type WeighmentScaleFormValues,
} from "@/features/device-label-masters/schemas";
import type { WeighmentScaleWritePayload } from "@/features/device-label-masters/types";
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import CodeMasterPage from "@/features/wpe-masters/components/CodeMasterPage";
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";

const defaultValues: WeighmentScaleFormValues = {
  code: "",
  name: "",
  department: 0,
  machine: 0,
  connection_type: "SERIAL",
  port_name: "COM1",
  baud_rate: 9600,
  data_bits: 8,
  parity: "NONE",
  stop_bits: 1,
  unit: null,
  is_auto_capture: false,
  is_active: true,
};

const WeighmentScaleCreationPage = () => {
  const departmentQuery = useQuery({
    queryKey: ["wpe-masters", "departments", "lookup"],
    queryFn: wpeMastersApi.departments.lookup,
  });
  const machineQuery = useQuery({
    queryKey: ["production-masters", "machine-creations", "lookup"],
    queryFn: productionMastersApi.machineCreations.lookup,
  });
  const unitQuery = useQuery({
    queryKey: ["wpe-masters", "units", "lookup"],
    queryFn: wpeMastersApi.units.lookup,
  });

  return (
    <CodeMasterPage
      title="Weighment Scale Creation"
      description="Configure weighing scale devices, machine mapping, communication settings, and auto-capture behavior."
      queryKey="weighment-scale-creations"
      api={deviceLabelMastersApi.weighmentScaleCreations}
      schema={weighmentScaleSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? "",
        name: record.name,
        department: record.department,
        machine: record.machine,
        connection_type: record.connection_type,
        port_name: record.port_name || "",
        baud_rate: Number(record.baud_rate ?? 9600),
        data_bits: Number(record.data_bits ?? 8),
        parity: record.parity,
        stop_bits: Number(record.stop_bits ?? 1),
        unit: record.unit,
        is_auto_capture: record.is_auto_capture,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        department: values.department,
        machine: values.machine,
        connection_type: values.connection_type,
        port_name: values.port_name,
        baud_rate: values.baud_rate,
        data_bits: values.data_bits,
        parity: values.parity,
        stop_bits: values.stop_bits,
        unit: values.unit,
        is_auto_capture: values.is_auto_capture,
        is_active: values.is_active,
      } satisfies WeighmentScaleWritePayload)}
      codeLabel="Scale Code*"
      nameLabel="Scale Name*"
      namePlaceholder="Enter scale name"
      showDescription={false}
      createLabel="Add Weighment Scale"
      createButtonLabel="Create Weighment Scale"
      editTitle="Edit Weighment Scale"
      createTitle="Create Weighment Scale"
      extraColumns={[
        { key: "department", title: "Department", render: (record) => record.department_name || "-" },
        {
          key: "machine",
          title: "Machine",
          render: (record) => (
            <div className="space-y-1">
              <div className="font-medium">{record.machine_name || "-"}</div>
              <div className="font-mono text-xs text-muted-foreground">{record.machine_code || "-"}</div>
            </div>
          ),
        },
        {
          key: "connection_type",
          title: "Connection Type",
          render: (record) => <DeviceLabelEnumBadge value={record.connection_type} />,
        },
        {
          key: "auto_capture",
          title: "Auto Capture",
          render: (record) => <DeviceLabelEnumBadge value={record.is_auto_capture ? "YES" : "NO"} />,
        },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
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
            name="machine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Machine*</FormLabel>
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(value) => field.onChange(Number(value))}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Machine" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(machineQuery.data ?? []).map((option) => (
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
            name="connection_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Connection Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Connection Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SERIAL">Serial</SelectItem>
                    <SelectItem value="USB">USB</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    <SelectItem value="COM1">COM1</SelectItem>
                    <SelectItem value="ttyS1">ttyS1</SelectItem>
                    <SelectItem value="ttyUSB0">ttyUSB0</SelectItem>
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
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(unitQuery.data ?? []).map((option) => (
                      <SelectItem key={option.id} value={String(option.id)}>
                        {option.uom_code ? `${option.uom_code} - ${option.name}` : option.name}
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
            name="is_auto_capture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Auto Capture</FormLabel>
                <Select value={field.value ? "YES" : "NO"} onValueChange={(value) => field.onChange(value === "YES")}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Auto Capture" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="YES">Yes</SelectItem>
                    <SelectItem value="NO">No</SelectItem>
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

export default WeighmentScaleCreationPage;
