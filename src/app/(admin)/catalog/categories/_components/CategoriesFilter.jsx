"use client";

import { SearchIcon, Check, FilterX } from "lucide-react";
import { useRouter } from "next/navigation";
import CreateNewButton from "../../../../../../components/shared/CreateNewButton";

export default function CategoriesFilter({
  filters,            
  appliedFilters,     
  setFilters,
  onApply,
  onClear
}) {

  const router = useRouter();

  // Show apply only if changed
  const isDirty =
    filters.starts_with !== appliedFilters.starts_with ||
    filters.status !== appliedFilters.status;

  const hasActiveFilters =
    appliedFilters.starts_with || appliedFilters.status;

  return (
    <div className="flex justify-between flex-wrap items-end gap-3 mb-4">

      {/* LEFT */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* SEARCH */}
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search category..."
            className="border border-gray-300 text-sm px-2 h-8 w-48 rounded-l placeholder-gray-400 focus:outline-none focus:border-gray-500"
            value={filters.starts_with}
            onChange={(e) => {
              const value = e.target.value;
              const nextFilters = {...filters, starts_with: value};
              setFilters(nextFilters);
              if (value === "") onApply(nextFilters);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApply(filters);
            }}
          />

          <span
            className="h-8 px-2 flex items-center border border-gray-300 border-l-0 bg-primary text-white rounded-r cursor-pointer hover:scale-105 transition"
            onClick={() => onApply(filters)}
          >
            <SearchIcon size={16} />
          </span>
        </div>

        {/* STATUS */}
        <select
          className="border border-gray-300 text-sm px-2 h-8 rounded focus:outline-none focus:border-gray-500"
          value={filters.status}
          onChange={(e) =>
            setFilters(prev => ({ ...prev, status: e.target.value }))
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
            className="flex text-sm items-center gap-1 h-8 px-3 border border-primary text-primary rounded hover:scale-105 transition cursor-pointer"
          >
            <Check size={16} />
            Apply
          </button>
        )}

        {/* CLEAR */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex text-sm items-center gap-1 h-8 px-3 border border-gray-500 text-gray-500 rounded hover:scale-105 transition cursor-pointer"
          >
            <FilterX size={16} />
            Clear Filters
          </button>
        )}

      </div>

      {/* RIGHT */}
      <CreateNewButton
        buttonTitle="Create Category"
        onClick={() => {
          const params = new URLSearchParams(window.location.search);

          router.push(
            `/catalog/categories/form?createNew=true&returnTo=${encodeURIComponent(
              params.toString()
            )}`
          );
        }}
      />

    </div>
  );
}
