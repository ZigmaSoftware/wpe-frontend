import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, ExternalLink, FileText, FolderOpen, RefreshCw, ShieldCheck, Upload } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { driveApi, type DriveFileRecord } from "@/features/drive/api/driveApi";
import { getApiErrorMessage } from "@/lib/api-helpers";

const driveQueryKey = ["drive", "files"] as const;
const DRIVE_REFETCH_INTERVAL_MS = 60_000;

const formatFileSize = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const size = Number(value);
  if (!Number.isFinite(size)) {
    return "-";
  }

  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let nextSize = size;
  while (nextSize >= 1024 && unitIndex < units.length - 1) {
    nextSize /= 1024;
    unitIndex += 1;
  }

  return `${nextSize.toLocaleString("en-IN", { maximumFractionDigits: unitIndex === 0 ? 0 : 1 })} ${units[unitIndex]}`;
};

const formatMimeType = (file: DriveFileRecord) => {
  if (file.isGoogleNative) {
    return "Google file";
  }

  if (!file.mimeType) {
    return "File";
  }

  const parts = file.mimeType.split("/");
  return parts[1]?.replaceAll("-", " ") || file.mimeType;
};

const formatModifiedTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return format(parsed, "dd MMM yyyy, HH:mm");
};

const DrivePage = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<DriveFileRecord | null>(null);

  const uploadMutation = useMutation({
    mutationFn: driveApi.uploadFile,
    onSuccess: async () => {
      toast.success("Drive file uploaded.");
      await queryClient.invalidateQueries({ queryKey: driveQueryKey });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: driveApi.downloadFile,
    onSuccess: () => {
      setDownloadTarget(null);
      toast.success("Google Drive file opened.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to download the Drive file."));
    },
  });

  const isBusy =
    uploadMutation.isPending ||
    downloadMutation.isPending ||
    downloadTarget !== null;
  const driveQuery = useQuery({
    queryKey: driveQueryKey,
    queryFn: driveApi.listFiles,
    retry: false,
    placeholderData: (previousData) => previousData,
    refetchInterval: isBusy ? false : DRIVE_REFETCH_INTERVAL_MS,
  });

  const files = driveQuery.data?.files ?? [];
  const lastUpdatedLabel = driveQuery.dataUpdatedAt > 0 ? format(driveQuery.dataUpdatedAt, "HH:mm:ss") : null;

  const handleUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      await uploadMutation.mutateAsync(file);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to upload the Drive file."));
    }
  };

  const handleDownloadConfirm = async () => {
    if (!downloadTarget) {
      return;
    }

    try {
      await downloadMutation.mutateAsync(downloadTarget);
    } catch {
      // Error toast is handled by the mutation.
    }
  };

  const renderTable = () => {
    if (driveQuery.isLoading && !driveQuery.data) {
      return <LoadingState label="Loading Drive files..." />;
    }

    if (driveQuery.isError && !driveQuery.data) {
      return (
        <ErrorState
          description={getApiErrorMessage(driveQuery.error, "Unable to load Drive files.")}
          action={
            <Button variant="outline" onClick={() => void driveQuery.refetch()}>
              Retry
            </Button>
          }
        />
      );
    }

    if (!files.length) {
      return (
        <EmptyState
          title="No Drive files found"
          description="The configured Drive folder is empty or the service account can only see shared files."
          action={
            <Button variant="outline" onClick={() => void driveQuery.refetch()}>
              Refresh
            </Button>
          }
        />
      );
    }

    return (
      <div className="overflow-hidden rounded-[24px] border border-[#d8e2ef] bg-white shadow-[0_18px_45px_-34px_rgba(15,23,42,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eef6] px-5 py-4">
          <div>
            <h2 className="font-display text-[1.05rem] font-semibold text-[#10233f]">Documents</h2>
            <p className="mt-1 text-sm text-[#5b6b81]">Files are listed from the configured Google Drive folder.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-[#d7e3f4] bg-[#f8fbff] px-3 py-1 text-xs font-semibold text-[#37517c]">
              {lastUpdatedLabel ? `Last updated ${lastUpdatedLabel}` : "Waiting for first sync"}
            </div>
            {isBusy ? (
              <div className="rounded-full border border-[#f1d99a] bg-[#fff7df] px-3 py-1 text-xs font-semibold text-[#8a6400]">
                Live polling paused during file action
              </div>
            ) : null}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-[#f8fafc] hover:bg-[#f8fafc]">
              <TableHead>Name</TableHead>
              <TableHead className="w-40">Type</TableHead>
              <TableHead className="w-32">Size</TableHead>
              <TableHead className="w-48">Modified</TableHead>
              <TableHead className="w-[240px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="max-w-[360px]">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf3fb] text-[#1C3A6B]">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#162033]" title={file.name}>
                        {file.name || "Untitled"}
                      </div>
                      {file.isGoogleNative ? <div className="text-xs text-[#64748b]">Opens in Google Drive</div> : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-[#334155]">{formatMimeType(file)}</TableCell>
                <TableCell className="text-[#334155]">{formatFileSize(file.size)}</TableCell>
                <TableCell className="text-[#334155]">{formatModifiedTime(file.modifiedTime)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-[#d5dfec] text-[#1C3A6B] hover:border-[#1C3A6B] hover:bg-[#eef4fd]"
                      onClick={() => file.webViewLink && window.open(file.webViewLink, "_blank", "noopener,noreferrer")}
                      disabled={!file.webViewLink}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View
                    </Button>
                    {!file.isGoogleNative ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[#d5dfec] text-[#1C3A6B] hover:border-[#1C3A6B] hover:bg-[#eef4fd]"
                        onClick={() => setDownloadTarget(file)}
                        disabled={downloadMutation.isPending}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-6 pt-4 md:pt-5">
      <section className="overflow-hidden rounded-[28px] border border-[#1C3A6B]/12 bg-[linear-gradient(135deg,#1C3A6B_0%,#22477f_62%,#10233f_100%)] shadow-[0_28px_60px_-36px_rgba(15,23,42,0.6)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f4d485]">
              <FolderOpen className="h-3.5 w-3.5" />
              Drive Documents
            </div>
            <h1 className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.04em] text-white">Drive</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#d7e2f3]">
              Manage ERP documents from the shared Google Drive folder with server-side downloads and protected writes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-white/8 text-white hover:border-[#f4d485] hover:bg-white/12"
              onClick={() => void driveQuery.refetch()}
              disabled={driveQuery.isFetching}
            >
              <RefreshCw className={driveQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
            <Button
              type="button"
              className="bg-[#f4d485] text-[#132745] shadow-[0_10px_22px_-14px_rgba(244,212,133,0.8)] hover:bg-[#e8c15d]"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadChange} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[22px] border-[#dce6f2] shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)]">
          <CardHeader>
            <CardDescription>Files visible</CardDescription>
            <CardTitle className="text-[1.6rem] text-[#10233f]">{files.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-[#5c6d82]">Listed from the configured Google Drive folder.</CardContent>
        </Card>

        <Card className="rounded-[22px] border-[#dce6f2] shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)]">
          <CardHeader>
            <CardDescription>Download mode</CardDescription>
            <CardTitle className="text-[1.2rem] text-[#10233f]">Django proxy</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-[#5c6d82]">Drive credentials stay on the server for downloads.</CardContent>
        </Card>

        <Card className="rounded-[22px] border-[#dce6f2] shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)]">
          <CardHeader>
            <CardDescription>Sync status</CardDescription>
            <CardTitle className="flex items-center gap-2 text-[1.2rem] text-[#10233f]">
              <ShieldCheck className="h-5 w-5 text-[#1C3A6B]" />
              {isBusy ? "Paused for action" : "Live every 1 min"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-[#5c6d82]">
            {lastUpdatedLabel ? `Last successful sync at ${lastUpdatedLabel}.` : "Waiting for the first successful sync."}
          </CardContent>
        </Card>
      </section>

      <section>{renderTable()}</section>

      <ConfirmDialog
        open={downloadTarget !== null}
        onOpenChange={(open) => {
          if (!open && !downloadMutation.isPending) {
            setDownloadTarget(null);
          }
        }}
        title="Download Drive File"
        description={
          downloadTarget
            ? `Open ${downloadTarget.name || "this file"} in Google Drive? Google will check access for the signed-in email before allowing view or download.`
            : "Open the selected file in Google Drive? Google will check access for the signed-in email before allowing view or download."
        }
        confirmLabel={downloadMutation.isPending ? "Opening..." : "Open in Drive"}
        cancelLabel="Cancel"
        onConfirm={() => void handleDownloadConfirm()}
      />
    </div>
  );
};

export default DrivePage;
