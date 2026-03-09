"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Loader2,
  Search,
  X,
  Receipt,
} from "lucide-react";

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

const statusStyles = {
  placed:    "bg-green-600 text-white",
  confirmed: "bg-green-600 text-white",
  cancelled: "bg-red-500 text-white",
  delivered: "bg-emerald-600 text-white",
  pending:   "bg-gray-400 text-white",
};

export default function OrdersSidebar({ activeOrderId }) {
  const router = useRouter();
  const [orders, setOrders]               = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const filterRef = useRef(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/orders`);
        const json = await res.json();
        setOrders(json?.data || []);
        setFilteredOrders(json?.data || []);
      } catch {
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleSearch = () => {
    const value = search.trim().toLowerCase();
    if (!value) {
      setFilteredOrders(orders);
      return;
    }
    setFilteredOrders(
      orders.filter(
        (o) =>
          o.order_number?.toLowerCase().includes(value) ||
          o.customer?.name?.toLowerCase().includes(value) ||
          o.status?.toLowerCase().includes(value)
      )
    );
  };

  // debounced — matches POSidebar pattern exactly
  useEffect(() => {
    const timer = setTimeout(() => handleSearch(), 400);
    return () => clearTimeout(timer);
  }, [search, orders]);

  const hasFilters = !!search;

  return (
    <aside
      className="flex flex-col min-h-screen"
      style={{ width: 260, minWidth: 260, borderRight: "1px solid #e5e7eb", background: "#fff" }}
    >
      {/* ── Sidebar header ── */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex justify-between items-center gap-1.5 w-full">
            <span className="text-sm font-semibold text-gray-700">Orders</span>
            <span className="text-xs text-gray-400">{filteredOrders.length} orders</span>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="p-1 rounded hover:bg-gray-100"
              title="Clear filters"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Search + filter row — identical structure to POSidebar */}
        <div className="relative" ref={filterRef}>
          <div className="flex items-center gap-1 border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            />
          </div>
        </div>
      </div>

      {/* ── Order list ── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-xs text-gray-400">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Receipt className="w-6 h-6 text-gray-200" />
            <p className="text-xs text-gray-400">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isActive = String(order.id) === String(activeOrderId);
            const placedAt = order.placed_at
              ? new Date(order.placed_at).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                })
              : "—";

            return (
              <button
                key={order.id}
                type="button"
                onClick={() => router.push(`/orders/${order.id}`)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors hover:bg-indigo-50/60 ${isActive ? "bg-indigo-50" : ""}`}
              >
                {/* Row 1: order number + status */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-semibold font-mono truncate"
                    style={{ color: isActive ? "#4f46e5" : "#1f2937" }}
                  >
                    {order.order_number || `#${order.id}`}
                  </span>
                  <span className={`text-[9px] font-semibold shrink-0 px-1.5 py-0.5 rounded-full uppercase ${statusStyles[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {order.status}
                  </span>
                </div>

                {/* Row 2: customer name */}
                <div className="mt-0.5 text-xs text-gray-500 truncate">
                  {order.customer?.name ?? "—"}
                </div>

                {/* Row 3: amount + date */}
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className="text-xs font-medium text-gray-700 tabular-nums">
                    {fmt(order.aggregates?.final_amount)}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {placedAt}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}