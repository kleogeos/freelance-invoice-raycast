// Run with: npx tsc src/render.test.ts --outDir /tmp/raycast-invoice-test --module commonjs
//   --target ES2021 --esModuleInterop && node /tmp/raycast-invoice-test/render.test.js
// (plain node, no test runner dependency — same convention as the CLI/JS twins of this tool)

import { parseItemsText, renderInvoice } from "./render";

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${name}`);
  }
}

const items = parseItemsText(
  "Website redesign, 1, 1800\nExtra revision round, 2, 90\n\nbad line\n , 1, 100",
);
check("parses 2 valid lines, skips blank/malformed ones", items.length === 2);
check(
  "first item parsed correctly",
  items[0].description === "Website redesign" &&
    items[0].qty === 1 &&
    items[0].rate === 1800,
);
check(
  "description with an embedded comma still parses",
  parseItemsText("A, B, 1, 50")[0]?.description === "A, B",
);

const out = renderInvoice({
  invoiceNumber: "INV-0001",
  from: "Jane Doe",
  to: "Acme Corp",
  date: "2026-10-22",
  dueDate: "2026-11-05",
  taxRate: 0,
  items,
  notes: "Net 14.",
});
check("invoice number present", out.includes("INV-0001"));
check("subtotal math (1800 + 180)", out.includes("Subtotal: $1,980.00"));
check("tax row omitted when zero", !out.includes("Tax ("));

const taxed = renderInvoice({
  invoiceNumber: "INV-0002",
  from: "A",
  to: "B",
  date: "",
  dueDate: "",
  taxRate: 10,
  items: [{ description: "x", qty: 1, rate: 100 }],
  notes: "",
});
check("tax applied when present", taxed.includes("Tax (10%): $10.00"));
check("total with tax", taxed.includes("Total: $110.00"));

const xss = renderInvoice({
  invoiceNumber: "X",
  from: "A",
  to: "B",
  date: "",
  dueDate: "",
  taxRate: 0,
  items: [{ description: "<script>alert(1)</script>", qty: 1, rate: 10 }],
  notes: "",
});
check(
  "description is HTML-escaped",
  !xss.includes("<script>") && xss.includes("&lt;script&gt;"),
);

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("All invoice render/parse checks passed.");
