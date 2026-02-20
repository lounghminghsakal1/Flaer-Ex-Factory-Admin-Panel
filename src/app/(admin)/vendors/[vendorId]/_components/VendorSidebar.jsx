"use client";

import { useRouter } from "next/navigation";
import { STATUS_VALUE_TO_LABEL, VENDOR_TYPE_VALUE_TO_LABEL, STATUS_LABEL_TO_VALUE, VENDOR_TYPE_LABEL_TO_VALUE } from "./vendorDetailsApi";

const STATUS_BADGE = {
  1: "bg-green-100 text-green-700",
  0: "bg-gray-100 text-gray-500",
  2: "bg-red-100 text-red-600",
};

function getStatusValue(status) {
  if (typeof status === "number") return status;
  return STATUS_LABEL_TO_VALUE[status] ?? 1;
}

function getVendorTypeLabel(type) {
  if (typeof type === "string") return type.charAt(0).toUpperCase() + type.slice(1);
  return VENDOR_TYPE_VALUE_TO_LABEL[type] ?? String(type);
}

function getStatusLabel(status) {
  if (typeof status === "string") return status.charAt(0).toUpperCase() + status.slice(1);
  return STATUS_VALUE_TO_LABEL[status] ?? String(status);
}

export default function VendorSidebar({ vendorsData, currentVendorId }) {
  const router = useRouter();
  const currentId = Number(currentVendorId);

  return (
    <aside className="w-[25%] max-w-[260px] h-screen sticky top-0 flex flex-col border-r border-gray-200 bg-white">
      {/* Sidebar Header */}
      <div className="px-3 py-3 border-b border-gray-300 bg-white">
        <h2 className="text-[16px] font-bold text-gray-700">Vendors</h2>
        <p className="text-[11px] text-gray-500 mt-0.5">{vendorsData?.length ?? 0} total</p>
      </div>

      {/* Vendor List */}
      <div className="flex-1 overflow-y-auto py-1">
        {(vendorsData ?? []).map((vendor) => {
          const isActive = vendor.id === currentId;
          const statusVal = getStatusValue(vendor.status);
          const badgeCls = STATUS_BADGE[statusVal] ?? "bg-gray-100 text-gray-500";

          return (
            <button
              key={vendor.id}
              type="button"
              onClick={() => router.push(`/vendors/${vendor.id}`)}
              className={`w-[99%] text-left px-3 py-2.5 transition-all border-l-2 group
                ${isActive
                  ? "bg-blue-50 border-l-blue-500 scale-[1.01] shadow-sm"
                  : "border-l-transparent hover:bg-gray-100 hover:border-l-gray-300"
                }`}
            >
              {/* Vendor Name */}
              <p className={`text-[13px] font-semibold leading-tight truncate
                ${isActive ? "text-primary" : "text-gray-800"}`}>
                {vendor.firm_name}
              </p>

              {/* Vendor Type + Status row */}
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-[11px] text-gray-400 truncate">
                  {getVendorTypeLabel(vendor.vendor_type)}
                </span>
                <span className="text-gray-300 text-[10px]">•</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badgeCls}`}>
                  {getStatusLabel(vendor.status)}
                </span>
              </div>
            </button>
          );
        })}

        {(!vendorsData || vendorsData.length === 0) && (
          <div className="px-4 py-6 text-center text-[12px] text-gray-400">
            No vendors found
          </div>
        )}
      </div>
    </aside>
  );
}