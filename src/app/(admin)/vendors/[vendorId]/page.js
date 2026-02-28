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
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors[0] ?? "Something went wrong");
      setVendorsData(json.data ?? []);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch vendors data "+err.message);
      console.log(isOnline ? "true" : "false");
      if (!isOnline) toast.error('Seems like your internet is off, check your internet connection');
      return [];
    }
  }

  return (
    <div>
      <HeaderWithBack title="Vendor Details" defaultBackPath="/vendors" />
      <div className="flex min-h-screen bg-gray-50 ">

        {/* Fixed Left Sidebar */}
        <VendorSidebar currentVendorId={vendorId} />

        {/*Main Content */}
        <main className="flex-1 overflow-y-auto">

          {/* Fixed Top Bar: Tabs + Action Buttons */}
          <div className="sticky top-0 z-20 bg-gray-50 px-5 border-b border-gray-300">

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-end gap-1 flex-1 pt-3">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      if (!isEditing || tab.key === "info") setActiveTab(tab.key);
                    }}
                    className={`relative px-5 py-2 text-[13.5px] font-medium transition-all whitespace-nowrap -mb-px
                      rounded-t-lg
                      ${activeTab === tab.key
                        ? "bg-primary text-white border border-b-0 border-primary shadow-sm"
                        : "bg-gray-200/60 text-gray-500 border border-transparent hover:text-gray-700 hover:bg-gray-300/60"
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
                <div className="flex items-center gap-2 flex-shrink-0 ">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm transition
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
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm transition
                        hover:scale-105 cursor-pointer bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <X size={14} strokeWidth={2} />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium shadow-sm transition
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

          {/* Tab Content  */}
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