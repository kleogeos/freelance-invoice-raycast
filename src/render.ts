// Same rendering logic as https://github.com/kleogeos/freelance-invoice-js (MIT, same author),
// ported to TypeScript. Kept as a plain copy (no shared npm package) to keep this
// extension dependency-free beyond @raycast/api.

export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  from: string;
  to: string;
  date: string;
  dueDate: string;
  taxRate: number;
  items: InvoiceItem[];
  notes: string;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function money(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function renderInvoice(data: InvoiceData): string {
  const items = data.items;
  const subtotal = items.reduce((acc, i) => acc + i.qty * i.rate, 0);
  const taxRate = data.taxRate || 0;
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  const rows = items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.description)}</td>` +
        `<td style='text-align:right'>${escapeHtml(String(i.qty))}</td>` +
        `<td style='text-align:right'>${money(i.rate)}</td>` +
        `<td style='text-align:right'>${money(i.qty * i.rate)}</td></tr>`,
    )
    .join("\n");

  const notes = escapeHtml(data.notes || "");
  const invoiceNumber = escapeHtml(data.invoiceNumber || "");

  return `<!doctype html><html><head><meta charset="utf-8">
<title>Invoice ${invoiceNumber}</title>
<style>
body{font-family:-apple-system,Arial,sans-serif;max-width:680px;margin:40px auto;color:#1a1a1a}
table{width:100%;border-collapse:collapse;margin-top:24px}
th,td{padding:8px;border-bottom:1px solid #ddd}
th{text-align:left;color:#666;font-size:13px;text-transform:uppercase}
.total{font-size:20px;font-weight:bold}
.meta{color:#666;font-size:14px}
@media print{body{margin:0}}
</style></head><body>
<h1>Invoice ${invoiceNumber}</h1>
<p class="meta">From: ${escapeHtml(data.from || "")}<br>
To: ${escapeHtml(data.to || "")}<br>
Date: ${escapeHtml(data.date || "")} &middot; Due: ${escapeHtml(data.dueDate || "")}</p>
<table>
<tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr>
${rows}
</table>
<p style="text-align:right;margin-top:16px">Subtotal: ${money(subtotal)}<br>
${taxRate ? `Tax (${taxRate}%): ${money(tax)}<br>` : ""}
<span class="total">Total: ${money(total)}</span></p>
${notes ? `<p class='meta'>${notes}</p>` : ""}
</body></html>`;
}

// Parses one item per line, formatted as "description, qty, rate".
// Lines that don't match (blank, missing a field, non-numeric qty/rate) are skipped.
export function parseItemsText(text: string): InvoiceItem[] {
  const items: InvoiceItem[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 3) continue;
    const rate = Number(parts[parts.length - 1]);
    const qty = Number(parts[parts.length - 2]);
    const description = parts
      .slice(0, parts.length - 2)
      .join(", ")
      .trim();
    if (!description || !Number.isFinite(qty) || !Number.isFinite(rate))
      continue;
    items.push({ description, qty, rate });
  }
  return items;
}
