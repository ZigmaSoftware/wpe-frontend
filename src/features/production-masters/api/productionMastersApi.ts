import { coreApi } from "@/lib/api";
import { codeMasterResource } from "@/lib/api/resourceHelpers";
import type {
  BagCreationRecord,
  BagCreationWritePayload,
  BinCreationRecord,
  BinCreationWritePayload,
  ColorCreationRecord,
  ColorCreationWritePayload,
  MachineCreationRecord,
  MachineCreationWritePayload,
  PackingMaterialRecord,
  PackingMaterialWritePayload,
  PackingTypeRecord,
  PackingTypeWritePayload,
  ProductionLineRecord,
  ProductionLineWritePayload,
  ProfileCreationRecord,
  ProfileCreationWritePayload,
  ProfileSizeRecord,
  ProfileSizeWritePayload,
  WorkCentreCreationRecord,
  WorkCentreCreationWritePayload,
} from "@/features/production-masters/types";

const BASE = "/api/production";

function buildProfileFormData(payload: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (key === "image_url") continue;
    if (value instanceof File) {
      fd.append(key, value);
    } else if (value === null || value === undefined) {
      // omit — don't clear existing files
    } else {
      fd.append(key, String(value));
    }
  }
  return fd;
}

export const productionMastersApi = {
  profileCreations: {
    ...codeMasterResource<ProfileCreationRecord, ProfileCreationWritePayload>(BASE, "profile-creations"),
    create: (payload: ProfileCreationWritePayload) =>
      coreApi.post<ProfileCreationRecord>(`${BASE}/profile-creations/`, buildProfileFormData(payload as unknown as Record<string, unknown>)).then((r) => r.data),
    update: (id: number, payload: Partial<ProfileCreationWritePayload>) =>
      coreApi.put<ProfileCreationRecord>(`${BASE}/profile-creations/${id}/`, buildProfileFormData(payload as unknown as Record<string, unknown>)).then((r) => r.data),
  },
  profileSizes: codeMasterResource<ProfileSizeRecord, ProfileSizeWritePayload>(BASE, "profile-sizes"),
  colorCreations: codeMasterResource<ColorCreationRecord, ColorCreationWritePayload>(BASE, "color-creations"),
  machineCreations: codeMasterResource<MachineCreationRecord, MachineCreationWritePayload>(BASE, "machine-creations"),
  workCentreCreations: codeMasterResource<WorkCentreCreationRecord, WorkCentreCreationWritePayload>(BASE, "work-centre-creations"),
  productionLines: codeMasterResource<ProductionLineRecord, ProductionLineWritePayload>(BASE, "production-lines"),
  binCreations: codeMasterResource<BinCreationRecord, BinCreationWritePayload>(BASE, "bin-creations"),
  bagCreations: codeMasterResource<BagCreationRecord, BagCreationWritePayload>(BASE, "bag-creations"),
  packingTypes: codeMasterResource<PackingTypeRecord, PackingTypeWritePayload>(BASE, "packing-types"),
  packingMaterials: codeMasterResource<PackingMaterialRecord, PackingMaterialWritePayload>(BASE, "packing-materials"),
};
