"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "created", label: "Created" },
  { value: "waiting_for_approval", label: "Waiting For Approval" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];

function statusColor(status) {
  switch (status) {
    case "created": return "#6b7280";
    case "waiting_for_approval": return "#d97706";
    case "approved": return "#16a34a";
    case "rejected": return "#dc2626";
    case "completed": return "#2563eb";
    default: return "#6b7280";
  }
}

function statusLabel(status) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

export default function POSidebar({ currentPoId }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // Fetch PO list
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus.length) params.set("status", filterStatus.join(","));
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => { if (res.status === "success") setOrders(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, filterStatus]);

  // Close filter on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilters(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clearAll = () => {
    setSearch("");
    setFilterStatus([]);
  };

  const hasFilters = search || filterStatus.length > 0;

  const toggleStatus = (val) => {
    setFilterStatus((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ width: 260, minWidth: 260, borderRight: "1px solid #e5e7eb", background: "#fff" }}>
      {/* Sidebar header */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Purchase Orders</span>
          {hasFilters && (
            <button type="button" onClick={clearAll} className="p-1 rounded hover:bg-gray-100" title="Clear filters">
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Search + filter row */}
        <div className="relative" ref={filterRef}>
          <div className="flex items-center gap-1 border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search POs..."
              className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowFilters((p) => !p)}
              className={`p-0.5 rounded transition-colors ${showFilters || filterStatus.length ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
              title="Filters"
            >
              <SlidersHorizontal size={13} />
            </button>
          </div>

          {/* Filter dropdown */}
          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg z-50 p-3" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
              <div className="flex flex-col gap-1">
                {STATUS_OPTIONS.map((s) => (
                  <label key={s.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filterStatus.includes(s.value)}
                      onChange={() => toggleStatus(s.value)}
                      className="rounded border-gray-300 accent-indigo-600"
                    />
                    <span className="text-xs text-gray-700 group-hover:text-gray-900">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PO list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-xs text-gray-400 text-center">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="px-4 py-6 text-xs text-gray-400 text-center">No purchase orders found</div>
        ) : (
          orders.map((po) => {
            const isActive = String(po.id) === String(currentPoId);
            return (
              <button
                key={po.id}
                type="button"
                onClick={() => router.push(`/purchase_orders/${po.id}`)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors hover:bg-indigo-50/60 ${isActive ? "bg-indigo-50" : ""}`}
              >
                <div className={`text-xs font-semibold truncate ${isActive ? "text-indigo-600" : "text-gray-800"}`} style={isActive ? { color: "#4f46e5" } : {}}>
                  {po.purchase_order_number || `PO #${po.id}`}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-500 truncate">{po.vendor?.firm_name || "—"}</span>
                  <span className="text-xs font-medium ml-2 shrink-0" style={{ color: statusColor(po.status) }}>
                    {statusLabel(po.status)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}