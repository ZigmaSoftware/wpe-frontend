import { useQuery } from "@tanstack/react-query";
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
import { wpeMastersApi } from "@/features/wpe-masters/api/wpeMastersApi";
import { productionMastersApi } from "@/features/production-masters/api/productionMastersApi";
import ProductionEnumBadge from "@/features/production-masters/components/ProductionEnumBadge";
import { machineCreationSchema, type MachineCreationFormValues } from "@/features/production-masters/schemas";

const defaultValues: MachineCreationFormValues = {
  code: "",
  name: "",
  machine_type: "BLENDING",
  department: null,
  capacity: undefined,
  capacity_uom: "",
  serial_no: "",
  manufacturer: "",
  status: "AVAILABLE",
  is_active: true,
};

const machineTypeLabel = (value: string) =>
  ({
    BLENDING: "Blending",
    GRANULATION: "Granulation",
    EXTRUSION: "Extrusion",
    HIGH_SPEED_MIX: "High Speed Mix",
    GRANULATOR: "Granulator",
    EXTRUDER: "Extruder",
    MIXER: "Mixer",
  })[value] ?? value;

const capacityUomLabel = (value: string) =>
  ({
    KG: "KG",
    HOUR: "Hour",
    KG_PER_HOUR: "KG / Hour",
  })[value] ?? value;

const MachineCreationsPage = () => {
  const departmentQuery = useQuery({
    queryKey: ["wpe-masters", "departments", "lookup"],
    queryFn: wpeMastersApi.departments.lookup,
  });

  return (
    <CodeMasterPage
      title="Machine Creations"
      description="Maintain production machines, machine types, capacities, and status."
      queryKey="production-machine-creations"
      api={productionMastersApi.machineCreations}
      schema={machineCreationSchema}
      defaultValues={defaultValues}
      mapRecordToForm={(record) => ({
        code: record.code ?? record.machine_code,
        name: record.name,
        machine_type: record.machine_type,
        department: record.department,
        capacity: record.capacity ? Number(record.capacity) : undefined,
        capacity_uom: record.capacity_uom ?? "",
        serial_no: record.serial_no,
        manufacturer: record.manufacturer ?? "",
        status: record.status,
        is_active: record.is_active,
      })}
      mapFormToPayload={(values) => ({
        name: values.name,
        machine_type: values.machine_type,
        department: values.department || null,
        capacity: values.capacity ?? null,
        capacity_uom: values.capacity_uom,
        serial_no: values.serial_no,
        manufacturer: values.manufacturer,
        status: values.status,
        is_active: values.is_active,
      })}
      codeLabel="Machine Code*"
      nameLabel="Machine Name*"
      namePlaceholder="Enter machine name"
      showDescription={false}
      createLabel="Add Machine"
      createButtonLabel="Create Machine"
      allowDelete={false}
      renderNameSecondary={(record) => record.department_name || "No department linked"}
      extraColumns={[
        { key: "machine_type", title: "Machine Type", render: (record) => machineTypeLabel(record.machine_type) },
        {
          key: "capacity",
          title: "Capacity",
          render: (record) => (record.capacity ? `${record.capacity} ${capacityUomLabel(record.capacity_uom)}` : "-"),
        },
        { key: "status", title: "Status", render: (record) => <ProductionEnumBadge value={record.status} /> },
      ]}
      renderExtras={({ form }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="machine_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Machine Type*</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Machine Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BLENDING">Blending</SelectItem>
                    <SelectItem value="GRANULATION">Granulation</SelectItem>
                    <SelectItem value="EXTRUSION">Extrusion</SelectItem>
                    <SelectItem value="HIGH_SPEED_MIX">High Speed Mix (Legacy)</SelectItem>
                    <SelectItem value="GRANULATOR">Granulator (Legacy)</SelectItem>
                    <SelectItem value="EXTRUDER">Extruder (Legacy)</SelectItem>
                    <SelectItem value="MIXER">Mixer (Legacy)</SelectItem>
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
                <FormLabel>Department</FormLabel>
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
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
            name="capacity_uom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity UOM</FormLabel>
                <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select UOM" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="HOUR">Hour</SelectItem>
                    <SelectItem value="KG_PER_HOUR">KG / Hour</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serial_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Machine Serial*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter machine serial" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter manufacturer" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="BREAKDOWN">Breakdown</SelectItem>
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

export default MachineCreationsPage;
