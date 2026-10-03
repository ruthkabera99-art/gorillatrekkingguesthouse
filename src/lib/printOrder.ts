const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (n: number) => `RWF ${Math.round(n).toLocaleString()}`;

const sourceLabel = (o: any) =>
  o.source_type === "room" ? "Room Service" : o.source_id === "online" ? "Online Order" : `Table ${o.source_id}`;

/** Prints an 80mm thermal ticket. kind="order" = kitchen/bar ticket, "bill" = guest receipt with prices. */
export function printOrder(o: any, kind: "order" | "bill") {
  const items = (o.order_items || []).filter((i: any) => i.status !== "cancelled");
  const ref = o.id.slice(0, 8).toUpperCase();
  const rows = items
    .map((i: any) =>
      kind === "bill"
        ? `<tr><td>${esc(i.product?.name)} x${i.quantity}</td><td class="r">${money(i.unit_price * i.quantity)}</td></tr>`
        : `<tr><td><b>${i.quantity} x</b> ${esc(i.product?.name)} <small>(${i.department})</small>${i.note ? `<br><i>${esc(i.note)}</i>` : ""}</td></tr>`,
    )
    .join("");
  const total = items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0);
  const html = `<!doctype html><html><head><title>${kind === "bill" ? "Receipt" : "Order"} ${ref}</title>
<style>body{font-family:monospace;width:72mm;margin:0 auto;padding:4mm;font-size:12px}h1{font-size:15px;text-align:center;margin:0}
p{margin:2px 0}.c{text-align:center}table{width:100%;border-collapse:collapse}td{padding:3px 0;vertical-align:top}.r{text-align:right;white-space:nowrap}
hr{border:0;border-top:1px dashed #000}.t{font-size:14px;font-weight:bold}@page{margin:0}</style></head><body>
<h1>Gorilla Trekking Guest House</h1><p class="c">Musanze, Rwanda</p><hr>
<p class="c t">${kind === "bill" ? "RECEIPT / BILL" : "ORDER TICKET"}</p>
<p>Ref: #${ref}</p><p>${esc(sourceLabel(o))}</p>
${o.guest_name ? `<p>Guest: ${esc(o.guest_name)}${o.guest_phone ? " · " + esc(o.guest_phone) : ""}</p>` : ""}
${o.assigned_waiter ? `<p>Waiter: ${esc(o.assigned_waiter)}</p>` : ""}
<p>Ordered: ${new Date(o.created_at).toLocaleString()}</p>
${kind === "bill" ? `<p>Printed: ${new Date().toLocaleString()}</p>` : ""}<hr>
<table>${rows || "<tr><td>No items</td></tr>"}</table><hr>
${kind === "bill" ? `<table><tr class="t"><td>TOTAL</td><td class="r">${money(total)}</td></tr></table>
<p>Payment: ${esc(String(o.payment_status).replace(/_/g, " ").toUpperCase())}</p><hr><p class="c">Thank you! Murakoze!</p>` : `${o.notes ? `<p>Notes: ${esc(o.notes)}</p>` : ""}`}
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300)}</script></body></html>`;
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
