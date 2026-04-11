import { forwardRef } from "react";
import { format, differenceInDays } from "date-fns";

const fmt = (n: number) => `RWF ${n.toLocaleString()}`;

type ReceiptItem = {
  name: string;
  qty: number;
  unitPrice: number;
  department: "kitchen" | "bar";
};

type ReceiptProps = {
  hotelName?: string;
  hotelAddress?: string;
  hotelPhone?: string;
  hotelEmail?: string;
  hotelTIN?: string;
  guestName: string;
  roomName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  adultsCount: number;
  childrenCount: number;
  nightlyRate: number;
  accommodationTotal: number;
  items: ReceiptItem[];
  invoiceNumber?: string;
  paymentMethod?: string | null;
  paymentReference?: string | null;
};

const PrintableReceipt = forwardRef<HTMLDivElement, ReceiptProps>(
  (
    {
      hotelName = "GORILLA TREKKING GUEST HOUSE",
      hotelAddress = "Musanze, Rwanda",
      hotelPhone = "+250 788 000 000",
      hotelEmail = "info@gorillatrekkingguesthouse.com",
      hotelTIN = "TIN: 000000000",
      guestName,
      roomName,
      roomType,
      checkIn,
      checkOut,
      adultsCount,
      childrenCount,
      nightlyRate,
      accommodationTotal,
      items,
      invoiceNumber,
      paymentMethod,
      paymentReference,
    },
    ref
  ) => {
    const nights = Math.max(1, differenceInDays(new Date(checkOut), new Date(checkIn)));
    const kitchenItems = items.filter((i) => i.department === "kitchen");
    const barItems = items.filter((i) => i.department === "bar");
    const kitchenTotal = kitchenItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const barTotal = barItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const servicesTotal = kitchenTotal + barTotal;
    const grandTotal = accommodationTotal + servicesTotal;
    const now = new Date();
    const invNo = invoiceNumber || `INV-${format(now, "yyyyMMdd-HHmmss")}`;

    const Line = () => <div className="receipt-line">{'─'.repeat(42)}</div>;
    const DottedLine = () => <div className="receipt-line receipt-dotted">{'┈'.repeat(42)}</div>;

    const ItemRow = ({ name, qty, total }: { name: string; qty: number; total: number }) => (
      <div className="receipt-row">
        <span className="receipt-item-name">{name} x{qty}</span>
        <span className="receipt-item-price">{fmt(total)}</span>
      </div>
    );

    return (
      <div ref={ref} className="receipt-paper" id="printable-receipt">
        {/* Header */}
        <div className="receipt-header">
          <div className="receipt-logo">🦍</div>
          <div className="receipt-hotel-name">{hotelName}</div>
          <div className="receipt-sub">{hotelAddress}</div>
          <div className="receipt-sub">Tel: {hotelPhone}</div>
          <div className="receipt-sub">{hotelEmail}</div>
          <div className="receipt-sub">{hotelTIN}</div>
        </div>

        <Line />

        <div className="receipt-title">GUEST INVOICE</div>
        <div className="receipt-sub receipt-center">
          {invNo}
        </div>
        <div className="receipt-sub receipt-center">
          {format(now, "dd MMM yyyy, HH:mm")}
        </div>

        <Line />

        {/* Guest Details */}
        <div className="receipt-section-title">GUEST DETAILS</div>
        <div className="receipt-row">
          <span>Name:</span>
          <span>{guestName}</span>
        </div>
        <div className="receipt-row">
          <span>Room:</span>
          <span>{roomName} ({roomType})</span>
        </div>
        <div className="receipt-row">
          <span>Check-in:</span>
          <span>{format(new Date(checkIn), "dd MMM yyyy")}</span>
        </div>
        <div className="receipt-row">
          <span>Check-out:</span>
          <span>{format(new Date(checkOut), "dd MMM yyyy")}</span>
        </div>
        <div className="receipt-row">
          <span>Guests:</span>
          <span>{adultsCount} adult{adultsCount !== 1 ? 's' : ''}{childrenCount > 0 ? `, ${childrenCount} child${childrenCount !== 1 ? 'ren' : ''}` : ''}</span>
        </div>

        <Line />

        {/* Accommodation */}
        <div className="receipt-section-title">ACCOMMODATION</div>
        <ItemRow
          name={`${nights} night${nights !== 1 ? 's' : ''} @ ${fmt(nightlyRate)}`}
          qty={1}
          total={accommodationTotal}
        />

        {/* Kitchen Items */}
        {kitchenItems.length > 0 && (
          <>
            <DottedLine />
            <div className="receipt-section-title">KITCHEN / ROOM SERVICE</div>
            {kitchenItems.map((item, i) => (
              <ItemRow key={`k-${i}`} name={item.name} qty={item.qty} total={item.unitPrice * item.qty} />
            ))}
            <div className="receipt-row receipt-subtotal">
              <span>Subtotal</span>
              <span>{fmt(kitchenTotal)}</span>
            </div>
          </>
        )}

        {/* Bar Items */}
        {barItems.length > 0 && (
          <>
            <DottedLine />
            <div className="receipt-section-title">BAR / DRINKS</div>
            {barItems.map((item, i) => (
              <ItemRow key={`b-${i}`} name={item.name} qty={item.qty} total={item.unitPrice * item.qty} />
            ))}
            <div className="receipt-row receipt-subtotal">
              <span>Subtotal</span>
              <span>{fmt(barTotal)}</span>
            </div>
          </>
        )}

        <Line />

        {/* Totals */}
        <div className="receipt-row">
          <span>Accommodation</span>
          <span>{fmt(accommodationTotal)}</span>
        </div>
        {servicesTotal > 0 && (
          <div className="receipt-row">
            <span>F&B Services</span>
            <span>{fmt(servicesTotal)}</span>
          </div>
        )}

        <div className="receipt-grand-total">
          <Line />
          <div className="receipt-row receipt-total-row">
            <span>GRAND TOTAL</span>
            <span>{fmt(grandTotal)}</span>
          </div>
          <Line />
        </div>

        {/* Payment Method */}
        {paymentMethod && (
          <>
            <div className="receipt-section-title">PAYMENT</div>
            <div className="receipt-row">
              <span>Method:</span>
              <span style={{ textTransform: 'capitalize' }}>
                {paymentMethod === "mobile_money" ? "Mobile Money" : paymentMethod}
              </span>
            </div>
            {paymentReference && (
              <div className="receipt-row">
                <span>Ref:</span>
                <span>{paymentReference}</span>
              </div>
            )}
            <Line />
          </>
        )}

        {/* Footer */}
        <div className="receipt-footer">
          <p>Thank you for staying with us!</p>
          <p>We hope to see you again soon.</p>
          <p className="receipt-sub">Powered by Gorilla Trekking Guest House</p>
        </div>
      </div>
    );
  }
);

PrintableReceipt.displayName = "PrintableReceipt";
export default PrintableReceipt;
