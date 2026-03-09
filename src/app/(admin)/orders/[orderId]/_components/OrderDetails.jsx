"use client";

import { useEffect, useState } from "react";
import React from "react";
import {
  Package, Loader2, MapPin, User, Truck,
  Layers, Sparkles, Receipt, Tag, Phone, Mail,
  ShieldCheck, Clock, Info, ChevronDown, ChevronUp,
} from "lucide-react";

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

const statusStyles = {
  placed:    "bg-green-600 text-gray-100",
  confirmed: "bg-green-600 text-gray-100",
  cancelled: "bg-red-500 text-gray-100",
  delivered: "bg-emerald-600 text-gray-100",
  pending:   "bg-gray-400 text-gray-100",
};

const columns = [
  "SKU NAME",
  "SKU CODE",
  "QUANTITY",
  "MRP",
  "UNIT PRICE",
  "SELLING PRICE",
  "TOTAL AMOUNT",
  "DISCOUNT",
  "TAX",
  "FINAL AMOUNT",
];

export default function OrderDetails({ orderId }) {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading]     = useState(true);
  // track which line items have attributes expanded
  const [expandedAttrs, setExpandedAttrs] = useState({});

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/orders/${orderId}`);
        const json = await res.json();
        if (!res.ok || json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to fetch order");
        setOrderData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const lineItems = orderData?.order_line_items ?? [];

  const placedAt = orderData?.placed_at
    ? new Date(orderData.placed_at).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  const di = orderData?.delivery_info     ?? {};
  const dd = orderData?.deliverer_details ?? {};
  const il = orderData?.info_for_labour   ?? {};

  const hasDeliveryInfo     = di.poc_details || di.prefered_delivery_time || di.audio_url || di.handle_with_care;
  const hasDelivererDetails = dd.driver_name || dd.vehicle_number || dd.driver_mobile_number;
  const hasLabourInfo       = il.floor_number > 0 || il.permitted_by_owner || il.ground_floor_included;

  const toggleAttrs = (id) =>
    setExpandedAttrs((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="w-full mx-auto">
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-gray-400">Loading order...</p>
        </div>
      ) : !orderData ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center text-sm text-gray-400">
          Order not found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

          {/* ── Card Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-blue-900">
                Order <span className="font-mono text-primary">#{orderData.order_number}</span>
              </h2>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${statusStyles[orderData.status] ?? "bg-gray-200 text-gray-600"}`}>
                {orderData.status}
              </span>
              {orderData.source_type && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold uppercase bg-purple-100 text-purple-700 border border-purple-200 capitalize">
                  {orderData.source_type}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Receipt className="w-3.5 h-3.5" />
              {placedAt}
            </div>
          </div>

          {/* ── Info Strip ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-b border-gray-100 divide-x divide-gray-100">
            <InfoCell icon={<User className="w-3 h-3 text-primary" />} label="Customer">
              <p className="text-sm font-medium text-gray-800">{orderData.customer?.name ?? "—"}</p>
              {orderData.customer?.mobile_number && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-2.5 h-2.5" />{orderData.customer.mobile_number}
                </p>
              )}
              {orderData.customer?.email && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Mail className="w-2.5 h-2.5" />{orderData.customer.email}
                </p>
              )}
            </InfoCell>
            <InfoCell icon={<Truck className="w-3 h-3 text-primary" />} label="Delivery Type">
              <p className="text-sm font-medium text-gray-800">{orderData.delivery_type ?? "—"}</p>
            </InfoCell>
            <InfoCell icon={<MapPin className="w-3 h-3 text-primary" />} label="Shipping Address">
              <p className="text-sm font-medium text-gray-800">{orderData.shipping_address ?? "—"}</p>
            </InfoCell>
            <InfoCell icon={<MapPin className="w-3 h-3 text-primary" />} label="Billing Address">
              <p className="text-sm font-medium text-gray-800">{orderData.billing_address ?? "—"}</p>
            </InfoCell>
            <InfoCell icon={<Receipt className="w-3 h-3 text-primary" />} label="Cart">
              <p className="text-sm font-medium text-gray-800 font-mono">#{orderData.cart ?? "—"}</p>
              {orderData.confirmed_at && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Confirmed: {new Date(orderData.confirmed_at).toLocaleDateString("en-IN")}
                </p>
              )}
            </InfoCell>
          </div>

          {/* ── Delivery / Labour info row ── */}
          {(hasDeliveryInfo || hasDelivererDetails || hasLabourInfo) && (
            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100 divide-x divide-gray-100">
              {hasDeliveryInfo && (
                <div className="flex flex-col gap-2 px-5 py-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <Info className="w-3 h-3 text-primary" />Delivery Info
                  </p>
                  {di.prefered_delivery_time && <KVRow label="Preferred Time" value={di.prefered_delivery_time} />}
                  {di.poc_details            && <KVRow label="POC Details"     value={di.poc_details} />}
                  {di.handle_with_care && (
                    <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      <ShieldCheck className="w-2.5 h-2.5" />Handle with Care
                    </span>
                  )}
                  {di.audio_url && (
                    <a href={di.audio_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline underline-offset-2">
                      Audio Note
                    </a>
                  )}
                </div>
              )}
              {hasDelivererDetails && (
                <div className="flex flex-col gap-2 px-5 py-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <Truck className="w-3 h-3 text-primary" />Deliverer Details
                  </p>
                  {dd.driver_name          && <KVRow label="Driver"  value={dd.driver_name} />}
                  {dd.vehicle_number       && <KVRow label="Vehicle" value={dd.vehicle_number} />}
                  {dd.driver_mobile_number && <KVRow label="Mobile"  value={dd.driver_mobile_number} />}
                </div>
              )}
              {hasLabourInfo && (
                <div className="flex flex-col gap-2 px-5 py-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary" />Labour Info
                  </p>
                  {il.floor_number > 0         && <KVRow label="Floor"       value={il.floor_number} />}
                  {il.permitted_by_owner        && <KVRow label="Owner"       value="Permitted" />}
                  {il.ground_floor_included     && <KVRow label="Ground Floor" value="Included" />}
                </div>
              )}
            </div>
          )}

          {/* ── Line Items Table ── */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-14 text-center text-sm text-gray-400">
                      No line items found.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((li) => {
                    const isBundle = li.line_item_type === "bundle";
                    const isLoose  = li.line_item_type === "loose";
                    const bf       = Number(li.product_sku?.bundle_factor) || null;
                    const totalUnits = isBundle && bf ? li.quantity * bf : null;
                    const hasAttrs = li.line_item_attributes?.length > 0;
                    const attrsOpen = !!expandedAttrs[li.id];

                    return (
                      <React.Fragment key={li.id}>
                        <tr className="hover:bg-gray-50/60 transition-colors">
                          {/* SKU NAME */}
                          <td className="px-3 py-3" style={{ width: 220 }}>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-gray-800 leading-snug">
                                {li.product_sku?.sku_name || "—"}
                              </span>
                              {isBundle && (
                                <span className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                  <Layers className="w-2.5 h-2.5" />
                                  Bundle {bf ? `×${bf}` : ""}
                                </span>
                              )}
                              {isLoose && (
                                <span className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Loose
                                </span>
                              )}
                              {/* Line item attributes toggle */}
                              {hasAttrs && (
                                <button
                                  onClick={() => toggleAttrs(li.id)}
                                  className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline w-fit mt-0.5"
                                >
                                  {attrsOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                  {attrsOpen ? "Hide" : "Show"} attributes
                                </button>
                              )}
                            </div>
                          </td>
                          {/* SKU CODE */}
                          <td className="px-3 py-3" style={{ width: 130 }}>
                            <span className="text-[10px] text-gray-500 font-mono bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                              {li.product_sku?.sku_code || "—"}
                            </span>
                          </td>
                          {/* QUANTITY */}
                          <td className="px-3 py-3" style={{ width: 80 }}>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-700 tabular-nums">{li.quantity ?? "—"}</span>
                              {totalUnits != null && (
                                <span className="text-[10px] text-primary font-semibold tabular-nums mt-0.5">
                                  = {totalUnits} units
                                </span>
                              )}
                            </div>
                          </td>
                          {/* MRP */}
                          <td className="px-3 py-3 text-sm text-gray-700 tabular-nums" style={{ width: 90 }}>
                            {fmt(li.product_sku?.mrp ?? li.mrp)}
                          </td>
                          {/* UNIT PRICE */}
                          <td className="px-3 py-3 text-sm text-gray-700 tabular-nums" style={{ width: 90 }}>
                            {fmt(li.unit_price)}
                          </td>
                          {/* SELLING PRICE */}
                          <td className="px-3 py-3 text-sm text-gray-700 tabular-nums" style={{ width: 90 }}>
                            {fmt(li.selling_price)}
                          </td>
                          {/* TOTAL AMOUNT */}
                          <td className="px-3 py-3 text-sm text-gray-700 tabular-nums" style={{ width: 100 }}>
                            {fmt(li.total_amount)}
                          </td>
                          {/* DISCOUNT */}
                          <td className="px-3 py-3" style={{ width: 90 }}>
                            {parseFloat(li.discount_amount) > 0 ? (
                              <span className="text-sm font-medium text-red-500 tabular-nums">
                                - {fmt(li.discount_amount)}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </td>
                          {/* TAX */}
                          <td className="px-3 py-3" style={{ width: 110 }}>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-700 tabular-nums">{fmt(li.tax_amount)}</span>
                              {parseFloat(li.cgst_amount) > 0 && (
                                <span className="flex flex-col text-[10px] text-gray-400 leading-tight mt-0.5">
                                  <span>CGST {fmt(li.cgst_amount)}</span>
                                  <span>SGST {fmt(li.sgst_amount)}</span>
                                </span>
                              )}
                            </div>
                          </td>
                          {/* FINAL AMOUNT */}
                          <td className="px-3 py-3" style={{ width: 110 }}>
                            <span className="text-sm font-semibold text-primary tabular-nums">
                              {fmt(li.final_amount)}
                            </span>
                          </td>
                        </tr>

                        {/* ── Line item attributes accordion row ── */}
                        {hasAttrs && attrsOpen && (
                          <tr key={`attrs-${li.id}`} className="bg-gray-50/80">
                            <td colSpan={columns.length} className="px-6 py-3">
                              <div className="flex flex-wrap gap-2">
                                {li.line_item_attributes
                                  .filter((a) => a.display_attribute)
                                  .map((attr) => (
                                    <div key={attr.id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-1.5">
                                      <Tag className="w-3 h-3 text-primary flex-shrink-0" />
                                      <span className="text-xs font-medium text-gray-700">{attr.name}</span>
                                      <span className="text-[10px] text-gray-400">{attr.description}</span>
                                      <span className={`text-xs font-semibold tabular-nums ${attr.attr_txn_type === "discount" ? "text-red-500" : "text-primary"}`}>
                                        {attr.attr_txn_type === "discount" ? "- " : ""}{fmt(attr.amount)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Order Attributes ── */}
          {orderData.order_attributes?.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                Order Attributes
              </p>
              <div className="flex flex-wrap gap-2">
                {orderData.order_attributes.map((attr) => (
                  <div key={attr.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                    <Tag className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700">{attr.attribute_name}</span>
                    <span className="text-[10px] font-mono text-gray-400 bg-white border border-gray-100 px-1.5 py-0.5 rounded">
                      {attr.attr_type}
                    </span>
                    {attr.description && (
                      <span className="text-[10px] text-gray-400">{attr.description}</span>
                    )}
                    <span className={`text-xs font-semibold tabular-nums ${attr.attr_txn_type === "discount" ? "text-red-500" : "text-primary"}`}>
                      {attr.attr_txn_type === "discount" ? "- " : ""}{fmt(attr.attribute_amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Amount Summary ── */}
          <div className="px-6 pb-6 flex justify-end mt-2">
            <div className="w-72">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Item Total</span>
                  <span className="font-medium text-gray-800 tabular-nums">{fmt(orderData.aggregates?.item_total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-red-500 tabular-nums">- {fmt(orderData.aggregates?.discount_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxable Amount</span>
                  <span className="font-medium text-gray-800 tabular-nums">{fmt(orderData.aggregates?.taxable_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">CGST</span>
                  <span className="font-medium text-gray-800 tabular-nums">{fmt(orderData.aggregates?.cgst_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">SGST</span>
                  <span className="font-medium text-gray-800 tabular-nums">{fmt(orderData.aggregates?.sgst_amount)}</span>
                </div>
                {parseFloat(orderData.aggregates?.igst_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">IGST</span>
                    <span className="font-medium text-gray-800 tabular-nums">{fmt(orderData.aggregates?.igst_amount)}</span>
                  </div>
                )}
                {parseFloat(orderData.aggregates?.delivery_partner_fee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-medium text-gray-800 tabular-nums">{fmt(orderData.aggregates?.delivery_partner_fee)}</span>
                  </div>
                )}
                {parseFloat(orderData.aggregates?.labour_fee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Labour Fee</span>
                    <span className="font-medium text-gray-800 tabular-nums">{fmt(orderData.aggregates?.labour_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pb-2.5 border-b border-gray-200">
                  <span className="text-gray-500">Total Savings</span>
                  <span className="font-medium text-red-500 tabular-nums">- {fmt(orderData.aggregates?.total_savings)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-semibold text-gray-700">Final Amount</span>
                  <span className="text-base font-bold text-green-600 tabular-nums">{fmt(orderData.aggregates?.final_amount)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Reusable info cell ─────────
const InfoCell = ({ icon, label, children }) => (
  <div className="flex flex-col gap-1 px-5 py-4">
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
      {icon}{label}
    </p>
    {children}
  </div>
);

// ── Small key-value row ───────────────────────────────────────────────────────
const KVRow = ({ label, value }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] text-gray-400 uppercase tracking-wide" style={{ minWidth: 60 }}>{label}</span>
    <span className="text-xs font-medium text-gray-700">{value}</span>
  </div>
);