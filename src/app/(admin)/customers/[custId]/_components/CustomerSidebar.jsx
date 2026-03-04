"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Phone, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const STATUS_BADGE = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
};

export default function CustomerSidebar({ custId }) {
  const router = useRouter();
  const currentId = Number(custId);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "";

  const [customersData, setCustomersData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  const handleSearch = (text = searchText, data = customersData) => {
    if (!text.trim()) {
      setFilteredCustomers(data);
      return;
    }
    const q = text.toLowerCase();
    setFilteredCustomers(
      data.filter(
        (c) =>
          c?.name?.toLowerCase().includes(q) ||
          c?.code?.toLowerCase().includes(q) ||
          c?.mobile_number?.includes(q) ||
          c?.email?.toLowerCase().includes(q)
      )
    );
  };

  useEffect(() => {
    handleSearch(searchText, customersData);
  }, [searchText, customersData]);

  useEffect(() => {
    fetchCustomersData();
  }, []);

  const fetchCustomersData = async () => {
    try {
      const parsedParams = new URLSearchParams(returnTo || "");
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/customers?${parsedParams.toString()}`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.status === "failure") {
        throw new Error(json?.errors?.[0] ?? "Something went wrong");
      }
      setCustomersData(json.data);
      setFilteredCustomers(json.data);
    } catch (err) {
      toast.error("Failed to load customers: " + err.message);
    }
  };

  return (
    <aside className="w-[25%] max-w-[260px] h-screen sticky top-0 flex flex-col border-r border-gray-200 bg-white">
      {/* Sidebar Header */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-gray-700">Customers</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {customersData?.length ?? 0} total
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50">
          <Search size={13} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search customers..."
            className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto py-1">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const isActive = customer.id === currentId;
            const badgeCls =
              STATUS_BADGE[customer.status] ?? "bg-gray-100 text-gray-500";

            return (
              <button
                key={customer.id}
                type="button"
                onClick={() =>
                  router.push(
                    returnTo
                      ? `/customers/${customer.id}?returnTo=${encodeURIComponent(returnTo)}`
                      : `/customers/${customer.id}`
                  )
                }
                className={`w-[99%] text-left px-3 py-2.5 transition-all border-l-2 group
                  ${
                    isActive
                      ? "bg-blue-50 border-l-blue-500 scale-[1.01] shadow-sm"
                      : "border-l-transparent hover:bg-gray-50 hover:border-l-gray-300"
                  }`}
              >
                {/* Name + Status */}
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p
                    className={`text-[13px] font-semibold leading-tight truncate ${
                      isActive ? "text-blue-700" : "text-gray-800"
                    }`}
                  >
                    {customer.name || "—"}
                  </p>
                  <span
                    className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${badgeCls}`}
                  >
                    {customer.status}
                  </span>
                </div>

                {/* Code */}
                <p className="text-[11px] text-gray-400 font-mono truncate mb-1">
                  {customer.code}
                </p>

                {/* Mobile */}
                {customer.mobile_number && (
                  <div className="flex items-center gap-1">
                    <Phone size={10} className="text-gray-400 shrink-0" />
                    <span className="text-[11px] text-gray-500 truncate">
                      {customer.mobile_number}
                    </span>
                  </div>
                )}

                {/* Email */}
                {customer.email && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Mail size={10} className="text-gray-400 shrink-0" />
                    <span className="text-[11px] text-gray-500 truncate">
                      {customer.email}
                    </span>
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="px-4 py-6 text-center text-[12px] text-gray-400">
            No customers found
          </div>
        )}
      </div>
    </aside>
  );
}