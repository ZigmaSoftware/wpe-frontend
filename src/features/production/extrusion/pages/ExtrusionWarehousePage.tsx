import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { getApiErrorMessage, formatDateTime } from "@/lib/api-helpers";
import MasterTable from "@/features/common-master/components/MasterTable";
import ExtrusionStatusBadge from "@/features/production/extrusion/components/ExtrusionStatusBadge";
import { usePackets, useReceiveWarehouse } from "@/features/production/extrusion/hooks/useExtrusion";

const ExtrusionWarehousePage = () => {
  const query = usePackets({ page: 1, pageSize: 100, status: "QC_APPROVED" });
  const receiveMutation = useReceiveWarehouse();

  const records = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extrusion Warehouse Transfer"
        description="Only QC-approved packets are available here. Scan/acknowledge each packet as it is received into the warehouse."
      />

      <MasterTable
        columns={[
          { key: "packet", title: "Packet No", render: (r) => <span className="font-mono text-xs">{r.packet_no}</span> },
          { key: "wo", title: "Work Order", render: (r) => r.work_order_no },
          { key: "profile", title: "Profile", render: (r) => r.profile_name },
          { key: "weight", title: "Net Weight (kg)", render: (r) => r.expected_net_weight },
          { key: "approved", title: "QC Approved At", render: (r) => formatDateTime(r.qc_approved_at) },
          { key: "status", title: "Status", render: (r) => <ExtrusionStatusBadge value={r.status} /> },
          {
            key: "actions",
            title: "Actions",
            className: "w-[160px] text-right",
            render: (r) => (
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    const result = await receiveMutation.mutateAsync({ id: r.id });
                    toast.success(result.message);
                  } catch (error) {
                    toast.error(getApiErrorMessage(error, "Failed to receive packet."));
                  }
                }}
              >
                Receive
              </Button>
            ),
          },
        ]}
        records={records}
        isLoading={query.isLoading}
        isError={query.isError}
        errorDescription="Packets could not be loaded."
        emptyTitle="No packets awaiting warehouse receipt"
        emptyDescription="Packets appear here once they are approved at shift-end QC."
        page={1}
        pageSize={100}
        total={records.length}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onRetry={() => query.refetch()}
      />
    </div>
  );
};

export default ExtrusionWarehousePage;
