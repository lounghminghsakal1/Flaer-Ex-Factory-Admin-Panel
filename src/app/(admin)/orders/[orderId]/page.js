"use client";

import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import OrderDetails from "./_components/OrderDetails";
import { useEffect, useState } from "react";
import Shipments from "./_components/Shipments";
import Invoices from "./_components/Invoices";

const TABS = [
  { key: "order-details", label: "Order Details" },
  { key: "shipments",     label: "Shipments"     },
  { key: "invoices",      label: "Invoices"       },
];

export default function OrderDetailsPage() {
  const params       = useParams();
  const orderId      = params.orderId;
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathName     = usePathname();

  const [activeTab, setActiveTab]         = useState("order-details");
  const [shipmentIntent, setShipmentIntent] = useState(null); 
  const [orderData, setOrderData]         = useState(null);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) { setActiveTab(tabFromUrl); setShipmentIntent(null); }
  }, [searchParams]);

  useEffect(() => {
    if (!orderId) return;
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/orders/${orderId}`)
      .then((r) => r.json())
      .then((json) => { if (json.status !== "failure") setOrderData(json.data); })
      .catch(console.error);
  }, [orderId]);

  const handleTabChange = (tabKey, intent) => {
    setShipmentIntent(intent ?? null);
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", tabKey);
    router.push(`${pathName}?${p.toString()}`);
    setActiveTab(tabKey);
  };

  const fmt = (val) =>
    val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

  const agg = orderData?.aggregates ?? {};

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/*  Top bar  */}
      <div className="flex items-center gap-4 px-5 py-3 bg-white border-b border-gray-200">

        <button
          onClick={() => router.push("/orders")}
          className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-gray-100 transition-colors shrink-0 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-base font-bold text-gray-800">
          #{orderData?.order_number ?? orderId}
        </span>

        <div className="flex items-center rounded-full border border-gray-200 bg-white p-1 gap-0.5 ml-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key, tab.key === "shipments" ? "list" : null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all whitespace-nowrap
                ${activeTab === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 gap-4 p-4 items-start">

        <main className="flex-1 min-w-0">
          {activeTab === "order-details" && (
            <OrderDetails orderId={orderId} onTabChange={handleTabChange} />
          )}
          {activeTab === "shipments" && <Shipments orderId={orderId} shipmentIntent={shipmentIntent} />}
          {activeTab === "invoices"  && <Invoices  orderId={orderId} />}
        </main>

        <aside className="w-72 shrink-0 flex flex-col gap-3">

          {/* Order Details card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs font-bold text-gray-700 mb-3">Order Details</p>
            <div className="flex flex-col gap-2">
              <SidebarRow label="Order No." value={orderData?.order_number ?? "—"} />
              <SidebarRow
                label="Order Status"
                value={
                  orderData?.status ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase
                      ${orderData.status === "confirmed" || orderData.status === "placed"
                        ? "bg-green-100 text-green-700"
                        : orderData.status === "cancelled"
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-600"}`}>
                      {orderData.status}
                    </span>
                  ) : "—"
                }
              />
              <SidebarRow
                label="Confirmed At"
                value={
                  orderData?.confirmed_at
                    ? new Date(orderData.confirmed_at).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })
                    : "—"
                }
              />
              <SidebarRow label="Expected Delivery" value={orderData?.expected_delivery_date ?? "—"} />
              <SidebarRow label="Order Created By"   value={orderData?.created_by ?? "—"} />
              {orderData?.billing_address && (
                <div className="pt-2 mt-1 border-t border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Billing Address</p>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{orderData.billing_address}</p>
                </div>
              )}
              {orderData?.shipping_address && (
                <div className="pt-2 mt-1 border-t border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Shipping Address</p>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{orderData.shipping_address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs font-bold text-gray-700 mb-3">Customer</p>
            <div className="flex flex-col gap-2">
              <SidebarRow label="Name"      value={orderData?.customer?.name ?? "—"} />
              <SidebarRow label="Customer ID" value={orderData?.customer?.member_id ?? "—"} />
              <SidebarRow label="GSTIN"     value={orderData?.customer?.gstin || "—"} />
            </div>
          </div>

          {/* Order Summary card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs font-bold text-gray-700 mb-3">Order Summary</p>
            <div className="flex flex-col gap-2">
              <SidebarRow label="Item Total"     value={fmt(agg.item_total)} />
              <SidebarRow
                label="Discount"
                value={<span className="text-[11px] font-medium text-red-500">-{fmt(agg.discount_amount)}</span>}
              />
              <SidebarRow label="Taxable Amount" value={fmt(agg.taxable_amount)} />
              <SidebarRow label="CGST"           value={fmt(agg.cgst_amount)} />
              <SidebarRow label="SGST"           value={fmt(agg.sgst_amount)} />
              {parseFloat(agg.igst_amount) > 0 && (
                <SidebarRow label="IGST"         value={fmt(agg.igst_amount)} />
              )}
              {parseFloat(agg.delivery_partner_fee) > 0 && (
                <SidebarRow label="Delivery Fee" value={fmt(agg.delivery_partner_fee)} />
              )}
              {parseFloat(agg.labour_fee) > 0 && (
                <SidebarRow label="Labour Fee"   value={fmt(agg.labour_fee)} />
              )}
              <SidebarRow
                label="Total Savings"
                value={<span className="text-[11px] font-medium text-red-500">-{fmt(agg.total_savings)}</span>}
              />
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-700">Final Amount</span>
                <span className="text-sm font-bold text-green-600">{fmt(agg.final_amount)}</span>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}

const SidebarRow = ({ label, value }) => (
  <div className="flex justify-between items-start gap-2">
    <span className="text-[11px] text-gray-400 shrink-0">{label}</span>
    <span className="text-[11px] font-medium text-gray-700 text-right">{value}</span>
  </div>
);