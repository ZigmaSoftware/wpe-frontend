import { useRef } from "react";
import QRCode from "react-qr-code";
import { Download, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CapturedOutputRecord } from "./productionOutputCapture";

// ─── helpers ──────────────────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatLabelDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
};

const formatLabelTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

// ─── types ────────────────────────────────────────────────────────────────────

export type QRLabelContext = {
  productionId: string;
  productionFor: string;
  itemName: string;
  itemCode: string;
};

type Props = {
  record: CapturedOutputRecord;
  context: QRLabelContext;
  onClose: () => void;
};

// ─── label renderer ───────────────────────────────────────────────────────────

const LABEL_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; }
  .wpe-label {
    border: 2px solid #000;
    width: 560px;
    font-family: Arial, sans-serif;
    background: #fff;
    page-break-inside: avoid;
  }
  .wpe-label-body {
    display: flex;
    gap: 0;
    padding: 14px;
  }
  .wpe-label-qr {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: 14px;
  }
  .wpe-label-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .wpe-label-title {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -0.5px;
    line-height: 1.1;
    color: #000;
  }
  .wpe-label-weight {
    font-size: 20px;
    font-weight: 700;
    color: #333;
    margin-bottom: 8px;
    margin-top: 2px;
  }
  .wpe-label-row {
    display: flex;
    gap: 4px;
    font-size: 12px;
    color: #000;
    line-height: 1.7;
  }
  .wpe-label-key {
    font-weight: 600;
    width: 60px;
    flex-shrink: 0;
  }
  .wpe-label-colon { flex-shrink: 0; }
  .wpe-label-val { word-break: break-all; }
  .wpe-label-footer {
    border-top: 1.5px solid #000;
    padding: 5px 14px;
    font-size: 11px;
    font-weight: 600;
    font-family: monospace;
    letter-spacing: 0.04em;
    color: #000;
    text-align: center;
  }
`;

// ─── component ────────────────────────────────────────────────────────────────

const QRLabelPreviewModal = ({ record, context, onClose }: Props) => {
  const labelRef = useRef<HTMLDivElement>(null);

  const binName = record.binlot !== "-" ? record.binlot : record.batchId;
  const weightDisplay = `${record.weightKg} kgs`;
  const dateDisplay = formatLabelDate(record.capturedAt);
  const timeDisplay = formatLabelTime(record.capturedAt);
  const refDisplay = `${record.recipeNo !== "—" ? record.recipeNo : context.productionId} / ${dateDisplay}`;
  const itemIdDisplay = context.itemCode || (record.details[0]?.itemCode ?? "-");
  const itemNameDisplay =
    context.productionFor || context.itemName || (record.details[0]?.itemName ?? "-");
  const footerBalance = `B: ${dateDisplay} ${timeDisplay} | Qty: ${record.qty} | Wt: ${record.weightKg} kgs`;

  // ── print helper ─────────────────────────────────────────────────────────────
  const buildPrintHtml = () => {
    const svgEl = labelRef.current?.querySelector("svg");
    const svgString = svgEl ? svgEl.outerHTML : "";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>QR Label — ${binName}</title>
  <style>
    ${LABEL_STYLES}
    @page { margin: 10mm; size: A6 landscape; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="wpe-label">
    <div class="wpe-label-body">
      <div class="wpe-label-qr">${svgString}</div>
      <div class="wpe-label-info">
        <div class="wpe-label-title">${binName}</div>
        <div class="wpe-label-weight">${weightDisplay}</div>
        <div class="wpe-label-row">
          <span class="wpe-label-key">Item ID</span>
          <span class="wpe-label-colon">:</span>
          <span class="wpe-label-val">${itemIdDisplay}</span>
        </div>
        <div class="wpe-label-row">
          <span class="wpe-label-key">Item</span>
          <span class="wpe-label-colon">:</span>
          <span class="wpe-label-val">${itemNameDisplay}</span>
        </div>
        <div class="wpe-label-row">
          <span class="wpe-label-key">Ref</span>
          <span class="wpe-label-colon">:</span>
          <span class="wpe-label-val">${refDisplay}</span>
        </div>
        <div class="wpe-label-row">
          <span class="wpe-label-key">S.No</span>
          <span class="wpe-label-colon">:</span>
          <span class="wpe-label-val">${record.scancodeId}</span>
        </div>
      </div>
    </div>
    <div class="wpe-label-footer">${footerBalance}</div>
  </div>
</body>
</html>`;
  };

  const openPrintWindow = (autoPrint: boolean) => {
    const win = window.open("", "_blank", "width=700,height=520");
    if (!win) return;
    win.document.write(buildPrintHtml());
    win.document.close();
    if (autoPrint) {
      win.onload = () => {
        win.focus();
        win.print();
      };
    } else {
      win.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="QR Label Preview"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-[14px] font-bold uppercase tracking-[0.14em] text-slate-900">
              QR Label Preview
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">{record.scancodeId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* label preview */}
        <div className="flex-1 overflow-auto p-6">
          <div
            ref={labelRef}
            className="mx-auto w-full max-w-[560px] overflow-hidden rounded-lg border-2 border-slate-900 bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.18)]"
          >
            {/* main body */}
            <div className="flex gap-0 p-4">
              {/* QR code */}
              <div className="flex shrink-0 items-center justify-center pr-4">
                <QRCode
                  value={record.scancodeId}
                  size={148}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>

              {/* label info */}
              <div className="flex flex-1 flex-col justify-center">
                <div className="text-[28px] font-black leading-tight tracking-tight text-slate-900">
                  {binName}
                </div>
                <div className="mb-2 mt-0.5 text-[18px] font-bold text-slate-700">
                  {weightDisplay}
                </div>
                <table className="w-full text-[11.5px] text-slate-900" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td className="pr-1 font-semibold" style={{ width: 56 }}>Item ID</td>
                      <td className="pr-1 font-semibold">:</td>
                      <td>{itemIdDisplay}</td>
                    </tr>
                    <tr>
                      <td className="pr-1 font-semibold">Item</td>
                      <td className="pr-1 font-semibold">:</td>
                      <td>{itemNameDisplay}</td>
                    </tr>
                    <tr>
                      <td className="pr-1 font-semibold">Ref</td>
                      <td className="pr-1 font-semibold">:</td>
                      <td>{refDisplay}</td>
                    </tr>
                    <tr>
                      <td className="pr-1 font-semibold">S.No</td>
                      <td className="pr-1 font-semibold">:</td>
                      <td className="font-mono text-[10.5px]">{record.scancodeId}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* footer balance row */}
            <div className="border-t-2 border-slate-900 px-4 py-1.5 text-center font-mono text-[11px] font-semibold tracking-wide text-slate-900">
              {footerBalance}
            </div>
          </div>
        </div>

        {/* actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openPrintWindow(false)}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download PDF
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => openPrintWindow(true)}
          >
            <Printer className="mr-1.5 h-4 w-4" />
            Print
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRLabelPreviewModal;
