"use client";

function fmt(val) {
  const num = parseFloat(val || 0);
  return `₹ ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AmountSummary({ aggregates }) {
  if (!aggregates) return null;

  const items = [
    { label: "Total Amount",    value: aggregates.total_price },
    { label: "Final Amount",    value: aggregates.final_amount,   green: true },
    { label: "CGST Amount",     value: aggregates.cgst_amount },
    { label: "SGST Amount",     value: aggregates.sgst_amount },
    { label: "IGST Amount",     value: aggregates.igst_amount },
    { label: "Tax Amount",      value: aggregates.tax_amount },
    { label: "Taxable Amount",  value: aggregates.taxable_amount },
  ];

  return (
    // w-72 keeps it compact; no border/shadow wrapper — plain rows
    <div className="w-72 shrink-0">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`flex items-center justify-between py-1.5 ${
            i < items.length - 1 ? "border-b border-gray-100" : ""
          }`}
        >
          <span
            className="text-sm"
            style={{ color: item.green ? "#16a34a" : "#4b5563", fontWeight: item.green ? 600 : 400 }}
          >
            {item.label}
          </span>
          <span
            className="text-sm"
            style={{ color: item.green ? "#16a34a" : "#111827", fontWeight: item.green ? 600 : 400 }}
          >
            {fmt(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}