"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Pencil, X, Save } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

import VendorSidebar from "./_components/VendorSidebar";
import VendorInfoTab from "./_components/VendorInfoTab";
import VendorSkuMappingTab from "./_components/VendorSkuMappingTab";
import HeaderWithBack from "../../../../../components/shared/HeaderWithBack";
import { toast } from "react-toastify";
import useOnlineCheck from "../../../../../components/hooks/useOnlineCheck";


const TABS = [
  { key: "info", label: "Vendor Info" },
  { key: "sku", label: "Vendor SKU Mapping" },
];

/**
 * VendorDetailPage
 *
 * Props:
 *   vendorsData — array of vendor objects from parent/list page
 *                 Each item needs: { id, firm_name, vendor_type, status }
 *
 * Usage in Next.js App Router:
 *   // app/vendors/[vendorId]/page.jsx
 *   import VendorDetailPage from "@/components/vendor-detail/VendorDetailPage";
 *   export default function Page() {
 *     // fetch vendorsData from your list API or pass via server component
 *     return <VendorDetailPage vendorsData={vendorsData} />;
 *   }
 */
export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params?.vendorId ?? params?.id;

  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendorsData, setVendorsData] = useState([]);

  const isOnline = useOnlineCheck();

  useEffect(() => {
    getVendorsData();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setActiveTab("info");
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Delegate to VendorInfoTab's internal save handler
      await window.__vendorSave?.();
    } finally {
      setSaving(false);
    }
  };

  async function getVendorsData() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors`
      );
      if (!res.ok) return [];
      const json = await res.json();
      setVendorsData(json.data ?? []);
    } catch (err) {
      console.log(err);
      console.log(isOnline ? "true" : "false");
      if(!isOnline) toast.error('Seems like your internet is off, check your internet connection');
      return [];
    }
  }

  return (
    <div>
      <HeaderWithBack title="Vendor Details" defaultBackPath="/vendors" />
      <div className="flex min-h-screen bg-gray-50 ">

        {/* ── Fixed Left Sidebar ─────────────────────────── */}
        <VendorSidebar vendorsData={vendorsData} currentVendorId={vendorId} />

        {/* ── Main Content ───────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">

          {/* ── Fixed Top Bar: Tabs + Action Buttons ───── */}
          <div className="sticky top-0 z-20 bg-gray-50 px-5 pt-3 pb-3 border-b border-gray-200">

            <div className="flex items-center justify-between gap-4">
              {/* Tabs — grid-wrap style like image */}
              <div className="flex flex-wrap gap-1.5 bg-[#eef0f7] rounded-md p-1.5 flex-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      if (!isEditing || tab.key === "info") setActiveTab(tab.key);
                    }}
                    className={`px-4 py-2 rounded-md text-[14px] font-medium transition-all whitespace-nowrap
                      ${activeTab === tab.key
                        ? "bg-primary text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 bg-white hover:bg-white/60"
                      }
                      ${isEditing && tab.key !== "info"
                        ? "opacity-40 cursor-not-allowed"
                        : "cursor-pointer"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              {activeTab !== "sku" && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium shadow-sm transition
                      hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 cursor-pointer bg-primary text-white hover:bg-primary/90"
                    >
                      <Pencil size={14} strokeWidth={2} />
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium shadow-sm transition
                        hover:scale-105 cursor-pointer bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <X size={14} strokeWidth={2} />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium shadow-sm transition
                        hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 cursor-pointer bg-green-600 text-white hover:bg-green-700"
                      >
                        <Save size={14} strokeWidth={2} />
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* ── Tab Content ────────────────────────────── */}
          <div className="px-5 py-4">
            {activeTab === "info" && (
              <VendorInfoTab
                vendorId={vendorId}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
              />
            )}
            {activeTab === "sku" && (
              <VendorSkuMappingTab vendorId={vendorId} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}