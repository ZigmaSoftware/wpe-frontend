import type { ZigmaModuleId } from "@/data/zigmaModuleFormFields";

interface ModuleFormFieldsReferenceProps {
  moduleId: ZigmaModuleId;
}

const ModuleFormFieldsReference = ({ moduleId }: ModuleFormFieldsReferenceProps) => {
  void moduleId;
  return null;
};

export default ModuleFormFieldsReference;
