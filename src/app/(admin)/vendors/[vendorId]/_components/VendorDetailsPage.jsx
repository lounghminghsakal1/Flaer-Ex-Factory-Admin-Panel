"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Pencil, X, Save } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

import VendorSidebar from "./VendorSidebar";
import VendorInfoTab from "./VendorInfoTab";
import VendorSkuMappingTab from "./VendorSkuMappingTab";

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

  useEffect(() => {
    getVendorsData();
  },[]);

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
        `${process.env.NEXT_PUBLIC_SAI_LOCAL}/admin/api/v1/procurement/vendors`,
        { cache: "no-store" }
      );
      if (!res.ok) return [];
      const json = await res.json();
      setVendorsData(json.data ?? []);
    } catch(err) {
      console.log(err);
      return [];
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">

      {/* ── Fixed Left Sidebar ─────────────────────────── */}
      <VendorSidebar vendorsData={vendorsData} currentVendorId={vendorId} />

      {/* ── Main Content ───────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-5 py-4">

          {/* ── Top bar: Tabs + Action Buttons ─────────── */}
          <div className="flex items-center justify-between mb-4">
            {/* Tabs */}
            <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    if (!isEditing || tab.key === "info") setActiveTab(tab.key);
                  }}
                  className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all
                    ${activeTab === tab.key
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                    }
                    ${isEditing && tab.key !== "info" ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action Buttons — YOU control these */}
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-blue-600 text-white text-[13px] font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Pencil size={13} strokeWidth={2} />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-[13px] font-medium hover:bg-gray-50 transition-colors"
                  >
                    <X size={13} strokeWidth={2} />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-blue-600 text-white text-[13px] font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <Save size={13} strokeWidth={2} />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Tab Content ────────────────────────────── */}
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
  );
}