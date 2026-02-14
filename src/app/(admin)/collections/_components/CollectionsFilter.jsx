import { useRouter } from "next/navigation";
import { SearchIcon, Check, FilterXIcon } from "lucide-react";
import CreateNewButton from "../../../../../components/shared/CreateNewButton";

export default function CollectionsFilter({
  filters,
  setFilters,
  setIsSearch,
  setCollectionsListData,
  setPage,
  setTotalPages,
}) {
  const router = useRouter();

  const hasActiveFilters = filters.starts_with || filters.active !== "";

  const defaultFilters = {
    starts_with: "",
    active: "",
  };

  return (
    <div className="w-full mx-auto my-4">
      <div className="flex justify-between flex-wrap items-end gap-3 mb-3">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Search */}
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search product by name..."
              className="border border-gray-300 text-gray-700 text-sm px-2 h-8 w-48 rounded-l 
              placeholder-gray-400 focus:outline-none focus:border-gray-500 transition"
              value={filters.starts_with}
              onChange={(e) => {
                const value = e.target.value;
                setFilters((prev) => ({ ...prev, starts_with: value }));
                if (value.trim() === "") {
                  setIsSearch((prev) => !prev);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsSearch((prev) => !prev);
                }
              }}
            />

            <span
              className="h-8 px-2 bg-primary flex items-center border border-gray-300 border-l-0 rounded-r cursor-pointer hover:scale-105 transition"
              onClick={() => setIsSearch((prev) => !prev)}
            >
              <SearchIcon size={16} color="white" />
            </span>
          </div>

          {/* Status */}
          <select
            className="border border-gray-300 text-sm px-2 h-8 rounded 
            placeholder-gray-400 focus:outline-none focus:border-gray-500 transition"
            value={filters.active}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                active: e.target.value,
              }));
              if (e.target.value === "") setIsSearch((prev) => !prev);
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Apply */}
          {hasActiveFilters && (
            <button
              className="flex items-center text-sm gap-1 h-8 px-3 border border-primary text-primary rounded 
              hover:scale-105 transition cursor-pointer"
              onClick={() => {
                setCollectionsListData([]);
                setPage(1);
                setTotalPages(1);
                setIsSearch((prev) => !prev);
              }}
            >
              <Check size={16} />
              Apply
            </button>
          )}

          {/* Clear */}
          {hasActiveFilters && (
            <button
              className="flex  text-sm items-center gap-1 h-8 px-3 border border-gray-700 text-gray-700 rounded 
              hover:scale-105 transition cursor-pointer"
              onClick={() => {
                setFilters(defaultFilters);
                setCollectionsListData([]);
                setPage(1);
                setTotalPages(1);
                setIsSearch((prev) => !prev);
              }}
            >
              <FilterXIcon size={16} />
              Clear Filters
            </button>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div>
          <CreateNewButton buttonTitle={"Create Collection"} onClick={() => router.push("/collections/create")} />
        </div>
      </div>
    </div>
  );
}
