import { Check } from "lucide-react";

type Props = { order: any };

const OrderStepper = ({ order }: Props) => {
  const items = (order.order_items || []).filter((i: any) => i.status !== "cancelled");
  const dept = (d: string) => items.filter((i: any) => i.department === d);
  const doneDept = (d: string) => {
    const list = dept(d);
    return list.length > 0 && list.every((i: any) => ["ready", "delivered"].includes(i.status));
  };
  const rank: Record<string, number> = { pending: 0, preparing: 1, ready: 2, delivered: 3 };
  const r = rank[order.status] ?? 0;
  const paid = order.payment_status === "paid" || order.payment_status === "charged_to_room";

  const steps = [
    { label: "Placed", done: true },
    ...(dept("kitchen").length ? [{ label: "Kitchen", done: r >= 2 || doneDept("kitchen"), active: r === 1 }] : []),
    ...(dept("bar").length ? [{ label: "Bar", done: r >= 2 || doneDept("bar"), active: r === 1 }] : []),
    { label: "Ready", done: r >= 2 },
    { label: "Delivered", done: r >= 3 },
    { label: order.payment_status === "charged_to_room" ? "On room bill" : "Paid", done: paid },
  ];

  if (order.status === "cancelled") {
    return <p className="text-xs font-sans text-destructive font-medium">Order cancelled</p>;
  }

  return (
    <ol className="flex items-center gap-1 flex-wrap" aria-label="Order progress">
      {steps.map((s: any, i) => (
        <li key={s.label} className="flex items-center gap-1">
          <span
            className={`flex items-center gap-1 text-[11px] font-sans px-2 py-0.5 rounded-full border ${
              s.done ? "bg-primary text-primary-foreground border-primary"
              : s.active ? "border-primary text-primary"
              : "border-border text-muted-foreground"
            }`}
          >
            {s.done && <Check size={10} />}{s.label}
          </span>
          {i < steps.length - 1 && <span className={`w-3 h-px ${s.done ? "bg-primary" : "bg-border"}`} />}
        </li>
      ))}
    </ol>
  );
};

export default OrderStepper;
