import {
  Action,
  ActionPanel,
  Form,
  showToast,
  Toast,
  open,
} from "@raycast/api";
import { useState } from "react";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { parseItemsText, renderInvoice } from "./render";

interface FormValues {
  invoiceNumber: string;
  from: string;
  to: string;
  date: string;
  dueDate: string;
  itemsText: string;
  taxRate: string;
  notes: string;
}

export default function Command() {
  const [itemsError, setItemsError] = useState<string | undefined>();

  async function handleSubmit(values: FormValues) {
    const items = parseItemsText(values.itemsText);
    if (items.length === 0) {
      setItemsError("Add at least one line as: description, qty, rate");
      return;
    }
    setItemsError(undefined);

    const html = renderInvoice({
      invoiceNumber: values.invoiceNumber,
      from: values.from,
      to: values.to,
      date: values.date,
      dueDate: values.dueDate,
      taxRate: Number(values.taxRate) || 0,
      items,
      notes: values.notes,
    });

    const fileName =
      `invoice-${values.invoiceNumber || Date.now()}.html`.replace(
        /[^a-zA-Z0-9.-]/g,
        "_",
      );
    const filePath = join(tmpdir(), fileName);
    writeFileSync(filePath, html, "utf8");

    await showToast({
      style: Toast.Style.Success,
      title: "Invoice ready",
      message: fileName,
    });
    await open(filePath);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Generate Invoice" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="invoiceNumber"
        title="Invoice Number"
        placeholder="INV-0001"
      />
      <Form.TextField
        id="from"
        title="From"
        placeholder="Jane Doe, Freelance Developer"
      />
      <Form.TextField id="to" title="To" placeholder="Acme Corp" />
      <Form.TextField id="date" title="Date" placeholder="2026-10-22" />
      <Form.TextField id="dueDate" title="Due Date" placeholder="2026-11-05" />
      <Form.TextArea
        id="itemsText"
        title="Items"
        placeholder={"Website redesign, 1, 1800\nExtra revision round, 2, 90"}
        info="One line per item: description, qty, rate"
        error={itemsError}
      />
      <Form.TextField
        id="taxRate"
        title="Tax Rate (%)"
        placeholder="0"
        defaultValue="0"
      />
      <Form.TextArea
        id="notes"
        title="Notes"
        placeholder="Net 14. Late payments accrue 1.5% monthly interest."
      />
    </Form>
  );
}
