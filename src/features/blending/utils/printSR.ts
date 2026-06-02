import type { StoreStockRequest } from "@/lib/types";

const fmt = (dt: string | null | undefined): string => {
  if (!dt) return "-";
  return new Date(dt)
    .toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " &")
    .toUpperCase();
};

const fmtDate = (d: string | null | undefined): string => {
  if (!d) return "-";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

export const printStoreRequest = (sr: StoreStockRequest): void => {
  const logoUrl = `${window.location.origin}/zigma.png`;
  const items = sr.items ?? [];
  const srNo = sr.request_no || `SR-${sr.id}`;
  const printedAt = fmt(sr.approved_at ?? sr.requested_at);

  // Use approved_qty when approved, else requested_qty
  const isApproved = ["APPROVED", "PARTIALLY_APPROVED"].includes(sr.status);

  const itemRows = items
    .map(
      (item, i) => `
      <tr>
        <td class="center">${i + 1}</td>
        <td>${item.item_code || "-"}</td>
        <td>${item.category || "-"}</td>
        <td>${item.sub_group || item.group || "Raw Materials"}</td>
        <td>${item.group || "-"}</td>
        <td>${item.item_name}</td>
        <td></td>
        <td class="center">${isApproved ? item.approved_qty : item.requested_qty}</td>
        <td class="center">${item.unit}</td>
        <td class="center">${fmtDate(sr.require_date)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Approved SR – ${srNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; padding: 12px; }

    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #666; padding: 4px 7px; vertical-align: middle; }

    /* ── header block ──────────────────────────────────── */
    .hdr-logo { width: 220px; text-align: center; }
    .hdr-logo img { height: 64px; object-fit: contain; }
    .hdr-title {
      background: #27a645; color: #fff;
      font-size: 22px; font-weight: bold;
      text-align: center; letter-spacing: 1px;
    }
    .meta td { border: 1px solid #666; }
    .lbl { font-weight: bold; font-size: 10px; }

    /* ── items table ───────────────────────────────────── */
    .items thead th {
      background: #27a645; color: #fff;
      font-size: 10px; text-align: center;
    }
    .items tbody tr:nth-child(even) td { background: #f9f9f9; }
    .items tfoot td { font-weight: bold; background: #f0f0f0; }
    .center { text-align: center; }

    /* ── purpose & sigs ────────────────────────────────── */
    .purpose td { border: 1px solid #666; padding: 6px 7px; }
    .sigs th {
      background: #27a645; color: #fff;
      text-align: center; width: 25%;
      font-weight: bold; font-size: 11px;
      padding: 5px;
    }
    .sigs td { height: 52px; }

    /* ── page footer ───────────────────────────────────── */
    .pgfoot { margin-top: 6px; font-size: 10px; }

    @media print {
      body { padding: 6px; }
      @page { margin: 8mm; size: A4 landscape; }
    }
  </style>
</head>
<body>

  <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
  <table style="margin-bottom:0">
    <tr>
      <td class="hdr-logo" rowspan="2">
        <img src="${logoUrl}" alt="ZIGMA" onerror="this.style.display='none'" />
      </td>
      <td class="hdr-title">Approved SR</td>
    </tr>
    <tr>
      <td>
        <span class="lbl">Approved SR No.:</span>&nbsp;<strong>${srNo}</strong>
        &emsp;&emsp;
        <span class="lbl">Date &amp; Time</span>&emsp;&emsp;${printedAt}
      </td>
    </tr>
  </table>

  <!-- ══ META ROWS ════════════════════════════════════════════════════════ -->
  <table class="meta" style="margin-top:-1px">
    <tr>
      <td style="width:50%">
        <span class="lbl">Requisitioner Name:</span>&nbsp;${sr.requested_for_name || "-"}
      </td>
      <td style="width:30%">
        <span class="lbl">Receiver Name / Department:</span><br/>${sr.department || "-"}
      </td>
      <td>
        <span class="lbl">Indent Receiving Date &amp; Time:</span>
      </td>
    </tr>
    <tr>
      <td>
        <span class="lbl">Department:</span>&nbsp;${sr.department || "-"}
        &emsp;&emsp;<span class="lbl">Sector:</span>&emsp;&emsp;&emsp;&emsp;
      </td>
      <td>
        <span class="lbl">Sub-Sector:</span>&emsp;&emsp;&emsp;
        <span class="lbl">GL Code:</span>
      </td>
      <td>
        <span class="lbl">TL Code:</span>
      </td>
    </tr>
  </table>

  <!-- ══ ITEMS TABLE ══════════════════════════════════════════════════════ -->
  <table class="items" style="margin-top:-1px">
    <thead>
      <tr>
        <th style="width:36px">Sl.</th>
        <th style="width:90px">Product Code</th>
        <th style="width:90px">Inventory Type</th>
        <th style="width:100px">Item Type</th>
        <th style="width:100px">Main Category</th>
        <th>Description of Goods</th>
        <th style="width:72px">HSN / SAC</th>
        <th style="width:54px">Qty</th>
        <th style="width:54px">Unit</th>
        <th style="width:90px">Expected Date</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows || `<tr><td colspan="10" style="text-align:center;color:#888">No items</td></tr>`}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="10">${items.length}</td>
      </tr>
    </tfoot>
  </table>

  <!-- ══ PURPOSE ══════════════════════════════════════════════════════════ -->
  <table class="purpose" style="margin-top:-1px">
    <tr>
      <td>
        <strong>Required for / Purpose of Indent:</strong><br/>
        ${sr.request_reason || "-"}
      </td>
    </tr>
  </table>

  <!-- ══ SIGNATURES ═══════════════════════════════════════════════════════ -->
  <table class="sigs" style="margin-top:10px">
    <tr>
      <th>Prepared By</th>
      <th>Requested By</th>
      <th>Verified By</th>
      <th>Approved By</th>
    </tr>
    <tr>
      <td>&nbsp;</td>
      <td style="font-size:10px;vertical-align:bottom;padding-bottom:4px">
        ${sr.requested_by_username || ""}
      </td>
      <td>&nbsp;</td>
      <td style="font-size:10px;vertical-align:bottom;padding-bottom:4px">
        ${sr.approved_by_username || ""}
      </td>
    </tr>
  </table>

  <p class="pgfoot">Pg. 1</p>

  <script>
    /* wait for logo, then auto-print */
    var img = document.querySelector('img');
    if (img && !img.complete) {
      img.onload = function() { window.print(); };
      img.onerror = function() { window.print(); };
    } else {
      window.print();
    }
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  const win = window.open(blobUrl, "_blank");
  if (!win) {
    URL.revokeObjectURL(blobUrl);
    alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
    return;
  }

  // Free blob memory after the window has had time to load it
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};
