import CreateNewButton from "../../../../../components/shared/CreateNewButton";
import { useRouter } from "next/navigation";
import { FilterX, SearchIcon, Check } from "lucide-react";

export default function VendorsFilters({ draftFilters = {}, setDraftFilters = null, onApply = null, isDirty = null, onClear = null, hasActiveFilters }) {
  const router = useRouter();

  const VENDOR_TYPE_OPTIONS = [
    { label: "manufacturer", value: 1, },
    { label: "distributor", value: 2, },
    { label: "wholesaler", value: 3, },
    { label: "service", value: 4 },
  ];

  return (
    <div className="w-full mx-auto my-4">

      <div className="flex justify-between flex-wrap items-end gap-3 mb-3">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* SEARCH */}
          <div className="flex items-center">

            <input
              type="text"
              placeholder="Search vendors..."
              className="border border-gray-300 text-gray-700 text-sm px-2 py-3 h-8 w-48 rounded-l placeholder-gray-400 focus:outline-none focus:border-gray-500 transition"
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
              className="h-8 px-2 py-3 bg-primary flex items-center border border-gray-300 border-l-0 rounded-r cursor-pointer hover:scale-105 transition"
              onClick={() => { if (draftFilters.starts_with.trim() === "") { return; }; onApply() }}
            >
              <SearchIcon size={16} color="white" />
            </span>

          </div>


          {/* Vendor Type */}
          <select
            className="border border-gray-300 text-sm px-2 h-8 rounded focus:outline-none focus:border-gray-500 transition"
            value={draftFilters.vendor_type}
            onChange={(e) =>
              setDraftFilters(prev => ({
                ...prev,
                vendor_type: e.target.value
              }))
            }
          >
            <option value="">All vendor types</option>
            {VENDOR_TYPE_OPTIONS.map((vendorType) => (<option key={vendorType.label} value={vendorType.label}>{vendorType.label}</option>))}
          </select>

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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value={"blocked"}>Blocked</option>
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
            buttonTitle="Create Vendor"
            onClick={() => router.push("/vendors/create?createNew=true")}
          />
        </div>

      </div>

    </div>
  );
}