"use client";

import { useEffect, useState } from "react";
import React from "react";
import {
  Loader2, Layers, Sparkles, Tag, ChevronDown, ChevronUp,
  ForwardIcon,
  ShipIcon,
} from "lucide-react";

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

const columns = [
  { key: "sku_name", label: "SKU NAME", width: 300 },
  { key: "quantity", label: "QTY", width: 60 },
  { key: "mrp", label: "MRP", width: 80 },
  { key: "unit_price", label: "UNIT PRICE", width: 85 },
  { key: "selling_price", label: "SELLING PRICE", width: 90 },
  { key: "total_amount", label: "TOTAL AMT", width: 85 },
  { key: "discount", label: "DISCOUNT", width: 80 },
  { key: "tax", label: "TAX", width: 100 },
  { key: "final_amount", label: "FINAL AMT", width: 85 },
];

const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function OrderDetails({ orderId, onTabChange }) {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAttrs, setExpandedAttrs] = useState({});

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/orders/${orderId}`);
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

  const toggleAttrs = (id) =>
    setExpandedAttrs((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="w-full mx-auto">
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-xs text-gray-400">Loading order...</p>
        </div>
      ) : !orderData ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center text-xs text-gray-400">
          Order not found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">

          {/* ── Header: Title + Buttons ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-primary">Order Line Items</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onTabChange?.("shipments", "forward")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-green-600 hover:opacity-80 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Create Forward Shipment
                <span className="flex items-center justify-center w-4 h-4 rounded ">
                  <ForwardIcon />
                </span>
              </button>
              <button
                onClick={() => onTabChange?.("shipments", "drop")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:opacity-80 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Create Drop Shipment
                <span className="flex items-center justify-center w-4 h-4 rounded ">
                  <ShipIcon />
                </span>
              </button>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{ width: col.width, minWidth: col.width }}
                      className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-12 text-center text-xs text-gray-400">
                      No line items found.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((li) => {
                    const isBundle = li.line_item_type === "bundle";
                    const isLoose = li.line_item_type === "loose";
                    const bf = Number(li.product_sku?.bundle_factor) || null;
                    const totalUnits = isBundle && bf ? li.quantity * bf : null;
                    const hasAttrs = li.line_item_attributes?.length > 0;
                    const attrsOpen = !!expandedAttrs[li.id];

                    return (
                      <React.Fragment key={li.id}>
                        <tr className="hover:bg-gray-50/60 transition-colors align-top">

                          {/* SKU NAME */}
                          <td className="px-3 py-2.5" style={{ width: 300, minWidth: 200 }}>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium text-gray-800 leading-snug line-clamp-2">
                                {li.product_sku?.sku_name || "—"}
                              </span>
                              {/* SKU code  */}
                              <span className="text-[10px] text-gray-400 font-mono leading-tight">
                                {li.product_sku?.sku_code || ""}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {isBundle && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                    <Layers className="w-2 h-2" />Bundle{bf ? ` ×${bf}` : ""}
                                  </span>
                                )}
                                {isLoose && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                    <Sparkles className="w-2 h-2" />Loose
                                  </span>
                                )}
                              </div>
                              {hasAttrs && (
                                <button
                                  onClick={() => toggleAttrs(li.id)}
                                  className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline w-fit cursor-pointer"
                                >
                                  {attrsOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                  {attrsOpen ? "Hide" : "Show"} attrs
                                </button>
                              )}
                            </div>
                          </td>

                          {/* QTY */}
                          <td className="px-3 py-2.5 tabular-nums" style={{ width: 60 }}>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-700">{li.quantity ?? "—"}</span>
                              {totalUnits != null && (
                                <span className="text-[9px] text-primary font-semibold">={totalUnits}u</span>
                              )}
                            </div>
                          </td>

                          {/* MRP */}
                          <td className="px-3 py-2.5 text-xs text-gray-700 tabular-nums" style={{ width: 80 }}>
                            {fmt(li.product_sku?.mrp ?? li.mrp)}
                          </td>

                          {/* UNIT PRICE */}
                          <td className="px-3 py-2.5 text-xs text-gray-700 tabular-nums" style={{ width: 85 }}>
                            {fmt(li.unit_price ?? li.selling_price)}
                          </td>

                          {/* SELLING PRICE */}
                          <td className="px-3 py-2.5 text-xs text-gray-700 tabular-nums" style={{ width: 90 }}>
                            {fmt(li.selling_price)}
                          </td>

                          {/* TOTAL AMOUNT */}
                          <td className="px-3 py-2.5 text-xs text-gray-700 tabular-nums" style={{ width: 85 }}>
                            {fmt(li.total_amount)}
                          </td>

                          {/* DISCOUNT */}
                          <td className="px-3 py-2.5" style={{ width: 80 }}>
                            {parseFloat(li.discount_amount) > 0 ? (
                              <span className="text-xs font-medium text-red-500 tabular-nums">
                                -{fmt(li.discount_amount)}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>

                          {/* TAX */}
                          <td className="px-3 py-2.5" style={{ width: 100 }}>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-gray-700 tabular-nums">{fmt(li.tax_amount)}</span>
                              {parseFloat(li.cgst_amount) > 0 && (
                                <span className="flex flex-col text-[9px] text-gray-400 leading-tight">
                                  <span>CGST {fmt(li.cgst_amount)} </span> 
                                  <span>SGST {fmt(li.sgst_amount)} </span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* FINAL AMOUNT */}
                          <td className="px-3 py-2.5" style={{ width: 85 }}>
                            <span className="text-xs font-semibold text-primary tabular-nums">
                              {fmt(li.final_amount)}
                            </span>
                          </td>
                        </tr>

                        {/* Attributes accordion */}
                        {hasAttrs && attrsOpen && (
                          <tr className="bg-gray-50/80">
                            <td colSpan={columns.length} className="px-4 py-2.5">
                              <div className="flex flex-wrap gap-1.5">
                                {li.line_item_attributes
                                  .filter((a) => a.display_attribute)
                                  .map((attr) => (
                                    <div key={attr.id} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg px-2.5 py-1">
                                      <Tag className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                                      <span className="text-[10px] font-medium text-gray-700">{attr.attribute_name}</span>
                                      {attr.description && (
                                        <span className="text-[10px] text-gray-400">{attr.description}</span>
                                      )}
                                      <span className={`text-[10px] font-semibold tabular-nums ${attr.attr_txn_type === "discount" ? "text-red-500" : "text-primary"}`}>
                                        {attr.attr_txn_type === "discount" ? "-" : ""}{fmt(attr.attribute_amount)}
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

          {/*  Order Attributes  */}
          {orderData.order_attributes?.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3 text-primary" />Order Attributes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {orderData.order_attributes.map((attr) => (
                  <div key={attr.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                    <Tag className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                    <span className="text-[10px] font-medium text-gray-700">{attr.attribute_name}</span>
                    <span className="text-[9px] font-mono text-gray-400 bg-white border border-gray-100 px-1 py-0.5 rounded">
                      {attr.attr_type}
                    </span>
                    {attr.description && (
                      <span className="text-[10px] text-gray-400">{attr.description}</span>
                    )}
                    <span className={`text-[10px] font-semibold tabular-nums ${attr.attr_txn_type === "discount" ? "text-red-500" : "text-primary"}`}>
                      {attr.attr_txn_type === "discount" ? "-" : ""}{fmt(attr.attribute_amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}