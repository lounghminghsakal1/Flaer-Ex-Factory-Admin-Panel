"use client";

import CreateNewButton from "../../../../../../components/shared/CreateNewButton";
import { useRouter } from "next/navigation";
import { FilterX, SearchIcon, Check } from "lucide-react";
import { useEffect, } from "react";

export default function ProductSkusFilters({ draftFilters = {}, setDraftFilters = null, onApply = null, isDirty = null, onClear = null, hasActiveFilters = null }) {
  const router = useRouter();

  useEffect(() => {
    if (draftFilters.by_purchase_order === "") {
      onApply();
    }
  }, [draftFilters.by_purchase_order]);

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