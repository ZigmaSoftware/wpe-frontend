import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { getApiErrorMessage, formatDateTime } from "@/lib/api-helpers";
import MasterTable from "@/features/common-master/components/MasterTable";
import ExtrusionStatusBadge from "@/features/production/extrusion/components/ExtrusionStatusBadge";
import ReasonPromptDialog from "@/features/production/extrusion/components/ReasonPromptDialog";
import { useReprintSticker, useScanSticker } from "@/features/production/extrusion/hooks/useExtrusion";
import { extrusionApi } from "@/features/production/extrusion/api/extrusionApi";
import type { PacketStickerRecord } from "@/features/production/extrusion/types";

const ExtrusionStickerScanPage = () => {
  const stickerInputId = useId();
  const [stickerNo, setStickerNo] = useState("");
  const [reprintTarget, setReprintTarget] = useState<PacketStickerRecord | null>(null);

  const stickersQuery = useQuery({
    queryKey: ["extrusion-stickers-recent"],
    queryFn: () => extrusionApi.stickers.list({ page: 1, pageSize: 50, ordering: "-generated_at" }),
  });
  const scanMutation = useScanSticker();
  const reprintMutation = useReprintSticker();

  const records = stickersQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extrusion Sticker & Scan"
        description="Scan a generated QR sticker against its packet, or reprint a sticker with a reason."
      />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!stickerNo.trim()) return;
            try {
              const result = await scanMutation.mutateAsync({ stickerNo: stickerNo.trim() });
              toast.success(result.message);
              setStickerNo("");
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Scan failed."));
            }
          }}
        >
          <div className="space-y-1">
            <Label htmlFor={stickerInputId}>Sticker Number</Label>
            <Input id={stickerInputId} value={stickerNo} onChange={(e) => setStickerNo(e.target.value)} placeholder="Scan or enter sticker number" autoFocus className="w-72" />
          </div>
          <Button type="submit" disabled={scanMutation.isPending}>Scan Sticker</Button>
        </form>
      </div>

      <MasterTable
        columns={[
          { key: "sticker", title: "Sticker No", render: (r) => <span className="font-mono text-xs">{r.sticker_no}</span> },
          { key: "packet", title: "Packet No", render: (r) => r.packet_no },
          { key: "status", title: "Status", render: (r) => <ExtrusionStatusBadge value={r.status} /> },
          { key: "generated", title: "Generated At", render: (r) => formatDateTime(r.generated_at) },
          { key: "scanned", title: "Scanned At", render: (r) => (r.scanned_at ? formatDateTime(r.scanned_at) : "-") },
          { key: "reprints", title: "Reprints", render: (r) => r.reprint_count },
          {
            key: "actions",
            title: "Actions",
            className: "w-[140px] text-right",
            render: (r) => (
              <Button size="sm" variant="outline" disabled={r.status !== "ACTIVE"} onClick={() => setReprintTarget(r)}>
                Reprint
              </Button>
            ),
          },
        ]}
        records={records}
        isLoading={stickersQuery.isLoading}
        isError={stickersQuery.isError}
        errorDescription="Stickers could not be loaded."
        emptyTitle="No stickers yet"
        emptyDescription="Generate a sticker from the Packing & Weight Verification screen once a packet's weight is accepted."
        page={1}
        pageSize={50}
        total={records.length}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
        onRetry={() => stickersQuery.refetch()}
      />

      <ReasonPromptDialog
        open={Boolean(reprintTarget)}
        onOpenChange={(open) => !open && setReprintTarget(null)}
        title="Reprint Sticker"
        description="A reason is required and every reprint is recorded in the audit trail."
        confirmLabel="Reprint"
        isSubmitting={reprintMutation.isPending}
        onConfirm={async (reason) => {
          if (reprintTarget) {
            try {
              await reprintMutation.mutateAsync({ id: reprintTarget.id, reason });
              toast.success("Sticker reprinted.");
              setReprintTarget(null);
            } catch (error) {
              toast.error(getApiErrorMessage(error, "Failed to reprint sticker."));
            }
          }
        }}
      />
    </div>
  );
};

export default ExtrusionStickerScanPage;
