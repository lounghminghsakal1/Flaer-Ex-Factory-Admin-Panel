import SearchableDropdown from "../../../../../../components/shared/SearchableDropdown";
import CreateNewButton from "../../../../../../components/shared/CreateNewButton";
import { useRouter } from "next/navigation";
import { SearchIcon, FilterX } from "lucide-react";

export default function ProductsFilter({draftFilters, setDraftFilters, brandOptions, parentCategoryOptions, subCategoryOptions, isDirty, handleApply, handleClear, hasActiveFilters}) {

  const router = useRouter();

  const handleCreateProduct = () => {
    const params = new URLSearchParams(window.location.search);

    router.push(
      `/catalog/products/form?createNew=true&returnTo=${encodeURIComponent(
        params.toString()
      )}`
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 my-2 p-2">
      <div className="flex items-center gap-1">
        {/* Search */}
        <div className="flex justify-center items-center">
          <input
            type="text"
            placeholder="Search product by name..."
            className="border border-gray-300 text-gray-700 text-sm px-2 py-3 h-8 w-40 rounded-l placeholder-gray-400 focus:outline-none focus:border-gray-500 transition placeholder:text-xs"
            value={draftFilters.starts_with}
            onChange={(e) => {
              const value = e.target.value;
              const nextFilters = { ...draftFilters, starts_with: value };
              setDraftFilters(nextFilters);
              if (value.trim() === "") handleApply(nextFilters);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApply(draftFilters);
            }}
          />
          <span className="h-8 px-2 py-3 flex items-center border border-gray-300 border-l-0 bg-primary text-white rounded-r cursor-pointer hover:scale-105 transition" onClick={() => handleApply(draftFilters)}><SearchIcon size={16} /></span>
        </div>

        {/* Status */}
        <select
          className="border border-gray-300 text-sm px-2 h-8 rounded focus:outline-none focus:border-gray-500"
          value={draftFilters.status}
          onChange={(e) =>
            setDraftFilters(prev => ({ ...prev, status: e.target.value }))
          }
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="deleted">Deleted</option>
        </select>

        {/* Brand */}
        <div className="w-36 ">
          <SearchableDropdown
            placeholder="Select Brand"
            options={brandOptions}
            value={draftFilters.brand_id}
            onChange={(value) =>
              setDraftFilters(prev => ({ ...prev, brand_id: value }))
            }
            heightClass="h-8"
          />
        </div>

        {/* Category */}
        <div className="flex gap-2 items-center ">
          {/* Parent Category */}
          <div className="w-41">
            <SearchableDropdown
              placeholder="Select Category"
              options={parentCategoryOptions}
              value={draftFilters.parent_category_id}
              onChange={(value) =>
                setDraftFilters(prev => ({
                  ...prev,
                  parent_category_id: value,
                  sub_category_id: ""
                }))
              }
              heightClass="h-8"
            />
          </div>
          {/* Sub Category */}
          {draftFilters.parent_category_id && (
            <div className="w-41">
              <SearchableDropdown
                placeholder="Select sub category"
                options={subCategoryOptions}
                value={draftFilters.sub_category_id}
                onChange={(value) =>
                  setDraftFilters(prev => ({ ...prev, sub_category_id: value }))
                }
                emptyMessage="No sub categories for the selected parent category "
                heightClass = "h-8"
              />
            </div>
          )}
        </div>

        {isDirty && (
          <button className="flex text-sm items-center gap-1 h-8 px-3 border border-primary text-primary rounded hover:scale-105 transition cursor-pointer" onClick={() => handleApply(draftFilters)}>
            Apply
          </button>
        )}

        <div>
          {hasActiveFilters && (
            <button className="flex text-sm items-center gap-1 h-8 px-3 border border-gray-500 text-gray-500 rounded hover:scale-105 transition cursor-pointer" onClick={() => {
              handleClear();
            }}
            >
              <FilterX size={16} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <CreateNewButton buttonTitle={"Create Product"} onClick={handleCreateProduct} />

    </div>
  );
}