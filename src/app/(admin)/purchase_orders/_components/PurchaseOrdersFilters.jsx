"use client";

import CreateNewButton from "../../../../../components/shared/CreateNewButton";
import { useRouter } from "next/navigation";
import { FilterX, SearchIcon, Check, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";

export default function PurchaseOrdersFilters({ draftFilters = {}, setDraftFilters = null, onApply = null, isDirty = null, onClear = null, hasActiveFilters = null }) {
  const router = useRouter();

  const [vendorsOptions, setVendorOptions] = useState([]);
  useEffect(() => {
    fetchVendorOptions();
  }, []);

  useEffect(() => {
    if (draftFilters.by_purchase_order === "") {
      onApply();
    }
  }, [draftFilters.by_purchase_order]);

  const fetchVendorOptions = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors?only_names=true`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.status === "failure") {
        throw new Error(json?.errors[0]);
      }
      console.log(json.data);
      setVendorOptions(json.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch vendor options " + err);
    }
  }
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);

  const filteredVendors = vendorSearch.trim()
    ? vendorsOptions.filter((vendor) =>
      vendor.firm_name.toLowerCase().includes(vendorSearch.toLowerCase())
    )
    : vendorsOptions;

  return (
    <div className="w-full mx-auto my-4">

      <div className="flex justify-between flex-wrap items-end gap-3 mb-3">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* SEARCH */}
          <div className="flex items-center">

            <input
              type="text"
              placeholder="Search by purchase order..."
              className="border border-gray-300 text-gray-700 text-sm px-2 py-3 h-8 w-48 rounded-l placeholder-gray-400 focus:outline-none focus:border-gray-500 transition"
              value={draftFilters.by_purchase_order || ""}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();

                setDraftFilters(prev => ({
                  ...prev,
                  by_purchase_order: value
                }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onApply();
                }
              }}
            />

            <span
              className="h-8 px-2 py-3 bg-primary flex items-center border border-gray-300 border-l-0 rounded-r cursor-pointer hover:scale-105 transition"
              onClick={() => { if (draftFilters.by_purchase_order.trim() === "") { return; }; onApply() }}
            >
              <SearchIcon size={16} color="white" />
            </span>
          </div>

          {/* by vendor */}
          <div className="relative w-48">
            {/* Trigger */}
            <button
              type="button"
              onClick={() => setVendorDropdownOpen((prev) => !prev)}
              className="flex items-center justify-between border border-gray-300 text-sm px-2 h-8 rounded focus:outline-none focus:border-gray-500 transition w-48"
            >
              <span className="truncate">
                {draftFilters.by_vendor
                  ? vendorsOptions.find((v) => String(v.id) === String(draftFilters.by_vendor))?.firm_name
                  : "All vendors"}
              </span>
              <ChevronDown size={14} className="text-gray-400 shrink-0" />
            </button>

            {/* Dropdown */}
            {vendorDropdownOpen && (
              <>
                {/* Backdrop to close on outside click */}
                <div className="fixed inset-0 z-40" onClick={() => { setVendorDropdownOpen(false); setVendorSearch(""); }} />

                <div className="absolute z-50 mt-1 w-48 bg-white border border-gray-200 rounded shadow-md">
                  {/* Search */}
                  <div className="p-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search..."
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      className="w-full text-sm px-2 py-1 bg-gray-100 rounded focus:outline-none"
                    />
                  </div>

                  {/* Options */}
                  <ul className="max-h-40 overflow-y-auto pb-1">
                    {!vendorSearch && (
                      <li
                        className="text-sm px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-gray-600"
                        onClick={() => { setDraftFilters((prev) => ({ ...prev, by_vendor: "" })); setVendorDropdownOpen(false); setVendorSearch(""); }}
                      >
                        All vendors
                      </li>
                    )}
                    {filteredVendors.length > 0 ? (
                      filteredVendors.map((vendor) => (
                        <li
                          key={vendor.id}
                          className="text-sm px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-gray-600"
                          onClick={() => { setDraftFilters((prev) => ({ ...prev, by_vendor: vendor.id })); setVendorDropdownOpen(false); setVendorSearch(""); }}
                        >
                          {vendor.firm_name}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm px-3 py-2 text-gray-400 text-center">No options found</li>
                    )}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* <select
            className="border border-gray-300 text-sm px-2 h-8 rounded focus:outline-none focus:border-gray-500 transition"
            value={draftFilters.by_vendor}
            onChange={(e) =>
              setDraftFilters(prev => ({
                ...prev,
                by_vendor: e.target.value
              }))
            }
          >
            <option value="">All vendors</option>
            {vendorsOptions.map((vendor, index) => (<option key={vendor.id}>{vendor.name}</option>))}
          </select> */}


          {/* STATUS */}
          <select
            className="border border-gray-300 text-sm px-2 h-8 rounded focus:outline-none focus:border-gray-500 transition"
            value={draftFilters.by_status}
            onChange={(e) =>
              setDraftFilters(prev => ({
                ...prev,
                by_status: e.target.value
              }))
            }
          >
            <option value="">All Status</option>
            <option value="created">Created</option>
            <option value="waiting_for_approval">Waiting For Approval</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* APPLY */}
          {isDirty && (
            <button
              onClick={onApply}
              className="flex items-center text-sm gap-1 h-8 px-3 border border-primary text-primary rounded hover:scale-105 transition cursor-pointer"
            >
              <Check size={16} />
              Apply
            </button>
          )}

          {/* CLEAR */}
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="flex text-sm items-center gap-1 h-8 px-3 border border-gray-700 text-gray-700 rounded hover:scale-105 transition cursor-pointer"
            >
              <FilterX size={16} />
              Clear Filters
            </button>
          )}

        </div>

        {/* RIGHT SIDE */}
        <div>
          <CreateNewButton
            buttonTitle="Create Purchase Order"
            onClick={() => router.push("/purchase_orders/create?createNew=true")}
          />
        </div>

      </div>

    </div>
  );
}