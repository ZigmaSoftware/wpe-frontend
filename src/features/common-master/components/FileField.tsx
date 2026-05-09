import { Paperclip, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FileFieldProps = {
  label: string;
  file?: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
};

const FileField = ({ label, file, existingUrl, onChange }: FileFieldProps) => (
  <div className="rounded-xl border border-border p-4">
    <div className="mb-3 flex items-center justify-between">
      <div className="text-sm font-medium">{label}</div>
      {file ? (
        <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      ) : null}
    </div>
    <div className="flex flex-col gap-3">
      <Input
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="cursor-pointer"
      />
      {file ? (
        <div className="inline-flex items-center gap-2 text-sm text-foreground">
          <Upload className="h-4 w-4 text-primary" />
          {file.name}
        </div>
      ) : existingUrl ? (
        <a
          href={existingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Paperclip className="h-4 w-4" />
          View current file
        </a>
      ) : (
        <div className="text-sm text-muted-foreground">No file uploaded.</div>
      )}
    </div>
  </div>
);

export default FileField;
