import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TableParamsLike } from "@/lib/api/resourceHelpers";
import { extrusionApi } from "@/features/production/extrusion/api/extrusionApi";
import { extrusionKeys } from "@/features/production/extrusion/api/queryKeys";
import type {
  ExtrusionInspectionWritePayload,
  ExtrusionKpiFilters,
  ExtrusionProfileConfigWritePayload,
  ExtrusionWorkOrderWritePayload,
  PacketCreatePayload,
  ScrapTransactionCreatePayload,
  ShiftApprovalBulkPayload,
  ShiftApprovalFilters,
  WeightCapturePayload,
} from "@/features/production/extrusion/types";

// Profile configs
export const useProfileConfigs = (params: TableParamsLike) =>
  useQuery({
    queryKey: extrusionKeys.profileConfigsList(params),
    queryFn: () => extrusionApi.profileConfigs.list(params),
  });

export const useCreateProfileConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExtrusionProfileConfigWritePayload) => extrusionApi.profileConfigs.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.profileConfigs() }),
  });
};

export const useUpdateProfileConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ExtrusionProfileConfigWritePayload> }) =>
      extrusionApi.profileConfigs.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.profileConfigs() }),
  });
};

export const useDeleteProfileConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => extrusionApi.profileConfigs.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.profileConfigs() }),
  });
};

// Work orders
export const useWorkOrders = (params: TableParamsLike) =>
  useQuery({
    queryKey: extrusionKeys.workOrdersList(params),
    queryFn: () => extrusionApi.workOrders.list(params),
  });

export const useWorkOrder = (id: number | null) =>
  useQuery({
    queryKey: extrusionKeys.workOrderDetail(id ?? 0),
    queryFn: () => extrusionApi.workOrders.get(id as number),
    enabled: Boolean(id),
  });

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExtrusionWorkOrderWritePayload) => extrusionApi.workOrders.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.workOrders() }),
  });
};

export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ExtrusionWorkOrderWritePayload> }) =>
      extrusionApi.workOrders.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.workOrders() }),
  });
};

export const useDeleteWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => extrusionApi.workOrders.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.workOrders() }),
  });
};

export const useReleaseWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => extrusionApi.workOrders.release(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.workOrders() }),
  });
};

// Inspections
export const useInspections = (params: TableParamsLike) =>
  useQuery({
    queryKey: extrusionKeys.inspectionsList(params),
    queryFn: () => extrusionApi.inspections.list(params),
  });

export const useCreateInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExtrusionInspectionWritePayload) => extrusionApi.inspections.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extrusionKeys.inspections() });
      queryClient.invalidateQueries({ queryKey: extrusionKeys.workOrders() });
    },
  });
};

// Packets
export const usePackets = (params: TableParamsLike) =>
  useQuery({
    queryKey: extrusionKeys.packetsList(params),
    queryFn: () => extrusionApi.packets.list(params),
  });

export const useCreatePacket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PacketCreatePayload) => extrusionApi.packets.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.packets() }),
  });
};

export const useWeighPacket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: WeightCapturePayload }) => extrusionApi.packets.weigh(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.packets() }),
  });
};

export const useGenerateSticker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => extrusionApi.packets.generateSticker(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extrusionKeys.packets() });
      queryClient.invalidateQueries({ queryKey: extrusionKeys.stickers() });
    },
  });
};

export const useReverseQcApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => extrusionApi.packets.reverseQcApproval(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.packets() }),
  });
};

export const useReceiveWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, warehouse }: { id: number; warehouse?: number | null }) =>
      extrusionApi.packets.receiveWarehouse(id, warehouse),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.packets() }),
  });
};

// Stickers
export const useReprintSticker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => extrusionApi.stickers.reprint(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.stickers() }),
  });
};

export const useScanSticker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stickerNo, packetId }: { stickerNo: string; packetId?: number }) =>
      extrusionApi.stickers.scan(stickerNo, packetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extrusionKeys.stickers() });
      queryClient.invalidateQueries({ queryKey: extrusionKeys.packets() });
    },
  });
};

// Shift-end approval
export const useShiftApprovalEligible = (filters: ShiftApprovalFilters, enabled = true) =>
  useQuery({
    queryKey: extrusionKeys.shiftApprovalEligible(filters),
    queryFn: () => extrusionApi.shiftApproval.eligible(filters),
    enabled,
  });

export const useApproveShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ShiftApprovalBulkPayload) => extrusionApi.shiftApproval.approve(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extrusionKeys.all });
    },
  });
};

// Scrap transactions
export const useScrapTransactions = (params: TableParamsLike) =>
  useQuery({
    queryKey: extrusionKeys.scrapTransactionsList(params),
    queryFn: () => extrusionApi.scrapTransactions.list(params),
  });

export const useCreateScrapTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScrapTransactionCreatePayload) => extrusionApi.scrapTransactions.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extrusionKeys.scrapTransactions() });
      queryClient.invalidateQueries({ queryKey: extrusionKeys.packets() });
    },
  });
};

export const useApproveScrapTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => extrusionApi.scrapTransactions.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: extrusionKeys.scrapTransactions() }),
  });
};

export const useReverseScrapTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => extrusionApi.scrapTransactions.reverse(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extrusionKeys.scrapTransactions() });
      queryClient.invalidateQueries({ queryKey: extrusionKeys.packets() });
    },
  });
};

// KPI dashboard
export const useExtrusionKpiDashboard = (filters: ExtrusionKpiFilters) =>
  useQuery({
    queryKey: extrusionKeys.kpiDashboard(filters),
    queryFn: () => extrusionApi.kpiDashboard.get(filters),
  });
