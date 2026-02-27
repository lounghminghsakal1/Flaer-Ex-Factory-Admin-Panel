"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import POSidebar from "./_components/POSidebar";
import PurchaseOrderDetails from "./_components/PurchaseOrderDetails";
import HeaderWithBack from "../../../../../components/shared/HeaderWithBack";
import PurchaseOrderAmendments from "./_components/PurchaseOrderAmendments";
import GoodsReceiveNote from "./_components/_grn_components/GoodsReceiveNote";
import { useSearchParams } from "next/navigation";

export default function PurchaseOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.poId;

  const [poData, setPoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "purchase_order");

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (key) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key); // update tab but keep others
    router.replace(`/purchase_orders/${poId}?${params.toString()}`);
  };

  const fetchPO = useCallback(() => {
    if (!poId) return;
    setLoading(true);
    setError(null);
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders/${poId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.status === "success") setPoData(res.data);
        else setError("Failed to load purchase order.");
      })
      .catch(() => setError("Failed to load purchase order."))
      .finally(() => setLoading(false));
  }, [poId]);

  useEffect(() => { fetchPO(); }, [fetchPO]);

  const showGRNTab = poData?.status === "approved" || poData?.status === "completed" ;
  const showAmndTab = poData?.status === "approved" || poData?.status === "completed";

  const TABS = [
    { key: "purchase_order", label: "Purchase Order" },
    ...(showAmndTab ? [{ key: "amdn", label: "Amendments" }] : []),
    ...(showGRNTab ? [{ key: "grn", label: "Goods Receive Note" }] : []),
  ];

  useEffect(() => {
    if (!TABS.find((t) => t.key === activeTab)) setActiveTab("purchase_order");
  }, [showGRNTab]);

  return (
    <div className=" overflow-hidden flex flex-col">
      <HeaderWithBack
        title="Purchase Order Details"
        defaultBackPath="/purchase_orders"
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Sidebar */}
        <POSidebar currentPoId={poId} />

        {/* Right column: tabs bar (fixed) + scrollable content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-gray-50">

          {/* Tabs — never scrolls, shrinks to its natural height */}
          <div className="shrink-0 bg-white border-b border-gray-200 px-6">
            <div className="flex gap-1 pt-4">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <div
                    key={tab.key}
                    type="button"
                    onClick={() => { setActiveTab(tab.key); handleTabChange(tab.key); }} //
                    className={`px-5 py-1.5 rounded-t-lg text-sm font-medium transition-colors ${isActive ? "bg-primary text-gray-100" : "bg-gray-200/60 text-gray-500 border border-transparent hover:text-gray-700 hover:bg-gray-300/60"} bg-gray-100 cursor-pointer `}
                  >
                    {tab.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm text-gray-400">Loading purchase order...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : activeTab === "purchase_order" && poData ? (
              <PurchaseOrderDetails
                poData={poData}
                poId={poId}
                onRefresh={fetchPO}
              />
            ) : activeTab === "grn" ? (
              <div className="bg-white rounded-xl border border-gray-200 p-2">
                <GoodsReceiveNote poId={poId} vendorId={poData.vendor.id} />
              </div>
            ) : activeTab === "amdn" ? (
              <div className="bg-white rounded-xl border border-gray-200 p-2">
                <PurchaseOrderAmendments poId={poId} refreshPo={fetchPO} />
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}