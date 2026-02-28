"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

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

function formatAmount(amount) {
  if (amount == null || amount === "") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function POSidebar({ currentPoId }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const filterRef = useRef(null);

  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    const params = new URLSearchParams(returnTo ? returnTo : "");
    // if (search) params.set("search", search);
    // if (filterStatus.length) params.set("status", filterStatus.join(","));
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => { if (res.status === "success") setOrders(res.data || []); setFilteredOrders(res?.data || []) })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target));
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clearAll = () => {
    setSearch("");
  };

  const hasFilters = search;

  const handleSearch = () => {
    const value = search.trim();

    if (!value) {
      setFilteredOrders(orders);
      return;
    }

    const filteredData = orders.filter(order =>
      order.purchase_order_number
        .toLowerCase()
        .includes(value.toLowerCase())
    );

    setFilteredOrders(filteredData);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, orders]);

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
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              placeholder="Search POs..."
              className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>

        </div>
      </div>

      {/* PO list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-xs text-gray-400 text-center">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="px-4 py-6 text-xs text-gray-400 text-center">No purchase orders found</div>
        ) : (
          filteredOrders.map((po) => {
            const isActive = String(po.id) === String(currentPoId);
            return (
              <button
                key={po.id}
                type="button"
                onClick={() => router.push(`/purchase_orders/${po.id}`)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors hover:bg-indigo-50/60 ${isActive ? "bg-indigo-50" : ""}`}
              >
                {/* Row 1: PO number + Status */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-semibold truncate"
                    style={{ color: isActive ? "#4f46e5" : "#1f2937" }}
                  >
                    {po.purchase_order_number || `PO #${po.id}`}
                  </span>
                  <span
                    className="text-xs font-medium shrink-0"
                    style={{ color: statusColor(po.status) }}
                  >
                    {statusLabel(po.status)}
                  </span>
                </div>

                {/* Row 2: Vendor name */}
                <div className="mt-0.5 text-xs text-gray-500 truncate">
                  {po.vendor?.firm_name || "—"}
                </div>

                {/* Row 3: Amount + Delivery date */}
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className="text-xs font-medium text-gray-700">
                    {formatAmount(po.final_amount)}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDate(po.delivery_date)}
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

