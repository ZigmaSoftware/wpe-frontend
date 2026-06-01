import { useEffect, useState } from "react";
import { ImageIcon, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CORE_API_URL } from "@/lib/env";

type ProfileImageFieldProps = {
  value: File | null | undefined;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
};

const resolveImageUrl = (url?: string | null) => {
  const value = url?.trim();
  if (!value) return null;
  if (/^(blob:|data:|https?:\/\/|\/\/)/i.test(value)) return value;
  return value.startsWith("/") ? `${CORE_API_URL}${value}` : value;
};

const ProfileImageField = ({ value, existingUrl, onChange }: ProfileImageFieldProps) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!(value instanceof File)) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const previewSrc = objectUrl ?? resolveImageUrl(existingUrl);

  return (
    <>
      <div className="rounded-xl border border-border p-4 space-y-3">
        {previewSrc ? (
          <div className="relative inline-block group">
            <img
              src={previewSrc}
              alt="Product preview"
              className="h-28 w-28 rounded-lg object-cover border cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ZoomIn className="h-6 w-6 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-lg border bg-muted/40">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        <Input
          type="file"
          accept="image/*"
          className="cursor-pointer"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />

        {value instanceof File ? (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => onChange(null)}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        ) : null}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl p-2 bg-transparent border-none shadow-none flex items-center justify-center">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Product image"
              className="max-h-[80vh] max-w-full rounded-xl object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileImageField;
