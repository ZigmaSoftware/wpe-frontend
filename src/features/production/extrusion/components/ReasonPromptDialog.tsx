import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReasonPromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  onConfirm: (reason: string) => void;
};

const ReasonPromptDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  isSubmitting = false,
  onConfirm,
}: ReasonPromptDialogProps) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason-prompt-input">Reason*</Label>
          <Textarea
            id="reason-prompt-input"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            autoFocus
            placeholder="Enter a reason — this is recorded in the audit trail."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!reason.trim() || isSubmitting} onClick={() => onConfirm(reason.trim())}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReasonPromptDialog;
