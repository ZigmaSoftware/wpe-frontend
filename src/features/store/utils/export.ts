import { formatDateTime } from "@/lib/api-helpers";
import type { StoreExportFormat } from "@/features/store/components/StoreTableToolbar";

export type StoreExportColumn<T> = {
  label: string;
  value: (row: T, index: number) => string | number | null | undefined;
};

const sanitizeCell = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const escapeCsv = (value: string) => {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
};

const createObjectUrlDownload = (filename: string, content: BlobPart, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const buildTableRows = <T,>(rows: T[], columns: StoreExportColumn<T>[]) =>
  rows.map((row, index) => columns.map((column) => sanitizeCell(column.value(row, index))));

const buildHtmlTable = (title: string, headers: string[], rows: string[][], subtitle?: string) => {
  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const rowHtml = rows
    .map(
      (row) =>
        `<tr>${row
          .map((value) => `<td>${escapeHtml(value)}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
      h1 { margin: 0 0 6px; font-size: 20px; }
      p { margin: 0 0 18px; color: #475569; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: #e2e8f0; font-weight: 700; }
      tr:nth-child(even) td { background: #f8fafc; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(subtitle ?? `Generated ${formatDateTime(new Date().toISOString())}`)}</p>
    <table>
      <thead>
        <tr>${headerHtml}</tr>
      </thead>
      <tbody>
        ${rowHtml}
      </tbody>
    </table>
  </body>
</html>`;
};

const openPrintWindow = (title: string, html: string) => {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1280,height=900");

  if (!printWindow) {
    throw new Error("Unable to open the print window. Please allow pop-ups for this site.");
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export const exportTableData = <T,>({
  title,
  filename,
  rows,
  columns,
  format,
}: {
  title: string;
  filename: string;
  rows: T[];
  columns: StoreExportColumn<T>[];
  format: StoreExportFormat;
}) => {
  const headers = columns.map((column) => column.label);
  const tableRows = buildTableRows(rows, columns);

  if (format === "csv") {
    const csvContent = `\uFEFF${[headers, ...tableRows].map((row) => row.map(escapeCsv).join(",")).join("\n")}`;
    createObjectUrlDownload(`${filename}.csv`, csvContent, "text/csv;charset=utf-8;");
    return;
  }

  if (format === "excel") {
    const html = buildHtmlTable(title, headers, tableRows);
    createObjectUrlDownload(`${filename}.xls`, html, "application/vnd.ms-excel;charset=utf-8;");
    return;
  }

  const subtitle =
    format === "pdf"
      ? "Choose Save as PDF in the print dialog to download a PDF copy."
      : undefined;
  const html = buildHtmlTable(title, headers, tableRows, subtitle);
  openPrintWindow(title, html);
};
