"use client";

import { useRouter } from "next/navigation";
import { SearchIcon, Check, FilterXIcon } from "lucide-react";
import CreateNewButton from "../../../../../components/shared/CreateNewButton";

export default function CollectionsFilter({
  draftFilters,
  appliedFilters,
  setDraftFilters,
  onApply,
  onClear
}) {

  const router = useRouter();

  const isDirty =
    draftFilters.starts_with !== appliedFilters.starts_with ||
    draftFilters.active !== appliedFilters.active;

  const hasActiveFilters =
    appliedFilters.starts_with || appliedFilters.active !== "";

  return (
    <div className="w-full mx-auto my-4">

      <div className="flex justify-between flex-wrap items-end gap-3 mb-3">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* SEARCH */}
          <div className="flex items-center">

            <input
              type="text"
              placeholder="Search collection..."
              className="border border-gray-300 text-gray-700 text-sm px-2 h-8 w-48 rounded-l placeholder-gray-400 focus:outline-none focus:border-gray-500 transition"
              value={draftFilters.starts_with}
              onChange={(e) => {
                const value = e.target.value;
                setDraftFilters(prev => ({
                  ...prev,
                  starts_with: value
                }))
                if (value.trim() === "") onApply();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onApply();
              }}
            />

            <span
              className="h-8 px-2 bg-primary flex items-center border border-gray-300 border-l-0 rounded-r cursor-pointer hover:scale-105 transition"
              onClick={onApply}
            >
              <SearchIcon size={16} color="white" />
            </span>

          </div>

          {/* STATUS */}
          <select
            className="border border-gray-300 text-sm px-2 h-8 rounded focus:outline-none focus:border-gray-500 transition"
            value={draftFilters.active}
            onChange={(e) =>
              setDraftFilters(prev => ({
                ...prev,
                active: e.target.value
              }))
            }
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
              <FilterXIcon size={16} />
              Clear Filters
            </button>
          )}

        </div>

        {/* RIGHT SIDE */}
        <div>
          <CreateNewButton
            buttonTitle="Create Collection"
            onClick={() => router.push("/collections/create")}
          />
        </div>

      </div>

    </div>
  );
}
