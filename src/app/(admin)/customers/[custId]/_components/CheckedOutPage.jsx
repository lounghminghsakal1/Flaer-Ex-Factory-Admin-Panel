import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CheckedOutPage({ cartData, customerId, onBack = null }) {
  const cartLineItems = cartData?.cart_line_items ?? [];
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push(`/customers/${customerId}?tab=place-order`);
    }
  };

  const fmt = (val) =>
    val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

  const columns = [
    "SKU NAME",
    "SKU CODE",
    "QUANTITY",
    "MRP",
    "UNIT PRICE",
    "SELLING UNIT PRICE",
    "SELLING PRICE",
    "DISCOUNT AMOUNT",
    "FINAL AMOUNT",
  ];

  return (
    <div className="w-full mx-auto py-4">
      {/* ── Page Title row ── */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 cursor-pointer font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
        <h1 className="text-xl font-bold text-blue-900 tracking-tight">Checkout</h1>
        {/* spacer to keep title centred */}
        <div className="w-24" />
      </div>

      {/* ── Body ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

        {/* ── Card Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-blue-900">Order Summary</h2>
            <span className="px-2 py-1 rounded-full text-xs uppercase bg-green-600 text-gray-100">
              {cartData?.status}
            </span>
          </div>
        </div>

        {/* ── Info Strip ── */}
        <div className="flex flex-wrap items-stretch gap-0 border-b border-gray-100">
          <InfoDiv label="Cart Number" value={cartData?.cart_number} />
          <InfoDiv label="Customer Name" value={cartData?.customer?.name} />
          <InfoDiv label="Shipping Address" value={cartData?.shipping_address} />
          <InfoDiv label="Billing Address" value={cartData?.billing_address} />
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cartLineItems.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-14 text-center text-sm text-gray-400">
                    No items found.
                  </td>
                </tr>
              ) : (
                cartLineItems.map((lineItem, index) => (
                  <tr key={lineItem.id || index} className="hover:bg-gray-50/60 transition-colors">
                    {/* SKU NAME */}
                    <td className="px-3 py-3 text-sm font-medium text-gray-800 w-[220px] min-w-[220px] max-w-[220px]">
                      {lineItem?.product_sku?.sku_name || "—"}
                    </td>
                    {/* SKU CODE */}
                    <td className="px-3 py-3 w-[70px]">
                      <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded">
                        {lineItem?.product_sku?.sku_code || "—"}
                      </span>
                    </td>
                    {/* QUANTITY */}
                    <td className="px-3 py-3 text-sm text-gray-700 w-[50px]">
                      {lineItem?.quantity ?? "—"}
                    </td>
                    {/* MRP */}
                    <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                      {fmt(lineItem?.product_sku?.mrp)}
                    </td>
                    {/* UNIT PRICE */}
                    <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                      {fmt(lineItem?.unit_price)}
                    </td>
                    {/* SELLING UNIT PRICE */}
                    <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                      {fmt(lineItem?.selling_unit_price)}
                    </td>
                    {/* SELLING PRICE */}
                    <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                      {fmt(lineItem?.selling_price)}
                    </td>
                    {/* DISCOUNT AMOUNT */}
                    <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                      {fmt(lineItem?.discount_amount)}
                    </td>
                    {/* FINAL AMOUNT */}
                    <td className="px-3 py-3 text-sm font-semibold text-gray-800 w-[110px]">
                      {fmt(lineItem?.final_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Amount Summary ── */}
        <div className="px-6 pb-6 flex justify-end">
          <div className="w-72 mt-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-medium text-gray-800">{fmt(cartData?.aggregates?.item_total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount Amount</span>
                <span className="font-medium text-gray-800">{fmt(cartData?.aggregates?.discount_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">CGST Amount</span>
                <span className="font-medium text-gray-800">{fmt(cartData?.aggregates?.cgst_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">SGST Amount</span>
                <span className="font-medium text-gray-800">{fmt(cartData?.aggregates?.sgst_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IGST Amount</span>
                <span className="font-medium text-gray-800">{fmt(cartData?.aggregates?.igst_amount)}</span>
              </div>
              <div className="flex justify-between text-sm pb-2.5 border-b border-gray-200">
                <span className="text-gray-500">Total Savings</span>
                <span className="font-medium text-red-500">
                  - {fmt(cartData?.aggregates?.total_savings)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-semibold text-gray-700">Final Payable Amount</span>
                <span className="text-base font-bold text-green-600">{fmt(cartData?.aggregates?.final_amount)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const InfoDiv = ({ label, value }) => {
  return (
    <div className="flex flex-col justify-center gap-1 px-6 py-4 border-r border-gray-100 last:border-r-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label ?? "Label"}</p>
      <p className="text-sm font-medium text-gray-800">{value ?? "—"}</p>
    </div>
  );
};