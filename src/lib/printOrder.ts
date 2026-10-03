const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (n: number) => `RWF ${Math.round(n).toLocaleString()}`;

const sourceLabel = (o: any) =>
  o.source_type === "room" ? "Room Service" : o.source_id === "online" ? "Online Order" : `Table ${o.source_id}`;

export const orderTotal = (o: any) =>
  (o.order_items || []).filter((i: any) => i.status !== "cancelled").reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0);

/**
 * Prints an 80mm thermal ticket through the device's installed receipt printer
 * (hidden iframe, so it works without pop-ups and from automatic triggers).
 * kind="order" = kitchen/bar slip, "bill" = guest receipt with prices.
 */
export function printOrder(o: any, kind: "order" | "bill", station?: "kitchen" | "bar") {
  const items = (o.order_items || []).filter((i: any) => i.status !== "cancelled" && (!station || i.department === station));
  const ref = String(o.id).slice(0, 8).toUpperCase();
  const rows = items
    .map((i: any) =>
      kind === "bill"
        ? `<tr><td>${esc(i.product?.name)} x${i.quantity}</td><td class="r">${money(i.unit_price * i.quantity)}</td></tr>`
        : `<tr><td class="big"><b>${i.quantity} x</b> ${esc(i.product?.name)}${station ? "" : ` <small>(${i.department})</small>`}${i.note ? `<br><i>* ${esc(i.note)}</i>` : ""}</td></tr>`,
    )
    .join("");
  const title = kind === "bill" ? "RECEIPT / BILL" : station ? `${station.toUpperCase()} TICKET` : "ORDER TICKET";
  const html = `<!doctype html><html><head><title>${title} ${ref}</title>
<style>body{font-family:monospace;width:72mm;margin:0 auto;padding:3mm;font-size:12px;color:#000}h1{font-size:15px;text-align:center;margin:0}
p{margin:2px 0}.c{text-align:center}table{width:100%;border-collapse:collapse}td{padding:3px 0;vertical-align:top}.r{text-align:right;white-space:nowrap}
.big{font-size:14px}hr{border:0;border-top:1px dashed #000}.t{font-size:14px;font-weight:bold}@page{size:80mm auto;margin:0}</style></head><body>
<h1>Gorilla Trekking Guest House</h1><p class="c">Musanze, Rwanda</p><hr>
<p class="c t">${title}</p>
<p>Ref: #${ref}</p><p class="t">${esc(sourceLabel(o))}</p>
${o.guest_name ? `<p>Guest: ${esc(o.guest_name)}${o.guest_phone ? " · " + esc(o.guest_phone) : ""}</p>` : ""}
${o.assigned_waiter ? `<p>Waiter: ${esc(o.assigned_waiter)}</p>` : ""}
<p>Ordered: ${new Date(o.created_at).toLocaleString()}</p>
${kind === "bill" ? `<p>Printed: ${new Date().toLocaleString()}</p>` : ""}<hr>
<table>${rows || "<tr><td>No items</td></tr>"}</table><hr>
${kind === "bill" ? `<table><tr class="t"><td>TOTAL</td><td class="r">${money(orderTotal(o))}</td></tr></table>
<p>Payment: ${esc(String(o.payment_status).replace(/_/g, " ").toUpperCase())}</p><hr><p class="c">Thank you! Murakoze!</p>` : `${o.notes ? `<p>Notes: ${esc(o.notes)}</p>` : ""}`}
</body></html>`;
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentWindow!.document;
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => {
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
    setTimeout(() => frame.remove(), 1000);
  }, 250);
  return true;
}
