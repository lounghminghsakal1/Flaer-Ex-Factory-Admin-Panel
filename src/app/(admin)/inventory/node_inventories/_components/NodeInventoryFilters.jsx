"use client";

import { FilterX, Check, ChevronDown, SearchIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

function SearchableDropdown({ options, value, onChange, placeholder, labelKey, valueKey, loading }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = search.trim()
    ? options.filter((o) => o[labelKey].toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = value
    ? options.find((o) => String(o[valueKey]) === String(value))?.[labelKey]
    : null;

  return (
    <div className="relative w-48">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between border border-gray-300 text-xs px-2 h-8 rounded focus:outline-none focus:border-gray-500 transition w-full text-gray-700"
      >
        <span className="truncate text-left">{selectedLabel ?? placeholder}</span>
        <ChevronDown size={13} className="text-gray-400 shrink-0 ml-1" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />
          <div className="absolute z-50 mt-1 w-48 bg-white border border-gray-200 rounded shadow-md">
            <div className="p-2">
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs px-2 py-1 bg-gray-100 rounded focus:outline-none"
              />
            </div>
            <ul className="max-h-44 overflow-y-auto pb-1">
              {!search && (
                <li
                  className="text-xs px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-gray-500 italic"
                  onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
                >
                  {placeholder}
                </li>
              )}
              {loading ? (
                <li className="text-xs px-3 py-2 text-gray-400 text-center">Loading...</li>
              ) : filtered.length > 0 ? (
                filtered.map((opt) => (
                  <li
                    key={`node-opt-${opt[valueKey]}`}
                    className={`text-xs px-3 py-1.5 hover:bg-gray-100 cursor-pointer ${
                      String(value) === String(opt[valueKey]) ? "text-blue-600 font-medium" : "text-gray-700"
                    }`}
                    onClick={() => { onChange(opt[valueKey]); setOpen(false); setSearch(""); }}
                  >
                    {opt[labelKey]}
                  </li>
                ))
              ) : (
                <li className="text-xs px-3 py-2 text-gray-400 text-center">No options found</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function SkuNameDropdown({ value, onChange }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const [selectedLabel, setSelectedLabel] = useState("");

  useEffect(() => {
    if (!value) setSelectedLabel("");
  }, [value]);

  const fetchSkus = async (query = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ only_names: "true", limit: 6 });
      if (query.trim()) params.set("starts_with", query.trim());
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/product_skus?${params.toString()}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed");
      setOptions(json.data ?? []);
    } catch (err) {
      toast.error("Failed to fetch SKUs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchSkus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSkus(search), 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  return (
    <div className="relative w-48">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between border border-gray-300 text-xs px-2 h-8 rounded focus:outline-none focus:border-gray-500 transition w-full text-gray-700"
      >
        <span className="truncate text-left">{selectedLabel || "All SKU Names"}</span>
        <ChevronDown size={13} className="text-gray-400 shrink-0 ml-1" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />
          <div className="absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded shadow-md">
            <div className="p-2">
              <input
                autoFocus
                type="text"
                placeholder="Search SKU name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs px-2 py-1 bg-gray-100 rounded focus:outline-none"
              />
            </div>
            <ul className="max-h-44 overflow-y-auto pb-1">
              {!search && (
                <li
                  className="text-xs px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-gray-500 italic"
                  onClick={() => {
                    onChange("");
                    setSelectedLabel("");
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  All SKU Names
                </li>
              )}
              {loading ? (
                <li className="text-xs px-3 py-2 text-gray-400 text-center">Loading...</li>
              ) : options.length > 0 ? (
                options.map((opt) => (
                  <li
                    key={`sku-opt-${opt.id}`}
                    className={`text-xs px-3 py-1.5 hover:bg-gray-100 cursor-pointer ${
                      String(value) === String(opt.id) ? "text-blue-600 font-medium" : "text-gray-700"
                    }`}
                    onClick={() => {
                      onChange(opt.id);
                      setSelectedLabel(opt.sku_name);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {opt.sku_name}
                  </li>
                ))
              ) : (
                <li className="text-xs px-3 py-2 text-gray-400 text-center">No SKUs found</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default function NodeInventoryFilters({
  draftFilters = {},
  setDraftFilters,
  appliedFilters = {},
  onApply,
  onClear,
}) {
  const [skuFilterType, setSkuFilterType] = useState(
    
    appliedFilters.by_sku_code ? "by_sku_code" : "by_product_sku"
  );

  const [nodeOptions, setNodeOptions] = useState([]);
  const [loadingNodes, setLoadingNodes] = useState(false);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      setLoadingNodes(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/locations/nodes?only_names=true`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed");
      setNodeOptions(json.data ?? []);
    } catch (err) {
      toast.error("Failed to fetch nodes: " + err.message);
    } finally {
      setLoadingNodes(false);
    }
  };

  const handleSkuFilterTypeChange = (e) => {
    setSkuFilterType(e.target.value);
    setDraftFilters((prev) => ({ ...prev, by_product_sku: "", by_sku_code: "" }));
  };

  const isDirty = JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);
  const hasActiveFilters = Object.values(appliedFilters).some((v) => v !== "");

  return (
    <div className="w-full mx-auto my-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">

        {/* BY NODE */}
        <SearchableDropdown
          options={nodeOptions}
          value={draftFilters.by_node}
          onChange={(val) => setDraftFilters((prev) => ({ ...prev, by_node: val }))}
          placeholder="All Nodes"
          labelKey="name"
          valueKey="id"
          loading={loadingNodes}
        />

        {/* SKU FILTER TYPE TOGGLE */}
        <select
          className="border border-gray-300 text-xs px-2 h-8 rounded focus:outline-none focus:border-gray-500 transition text-gray-700"
          value={skuFilterType}
          onChange={handleSkuFilterTypeChange}
        >
          <option value="by_product_sku">By SKU Name</option>
          <option value="by_sku_code">By SKU Code</option>
        </select>

        {/* SKU NAME DROPDOWN */}
        {skuFilterType === "by_product_sku" && (
          <SkuNameDropdown
            value={draftFilters.by_product_sku}
            onChange={(id) =>
              setDraftFilters((prev) => ({ ...prev, by_product_sku: id, by_sku_code: "" }))
            }
          />
        )}

        {/* SKU CODE TEXT INPUT */}
        {skuFilterType === "by_sku_code" && (
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Enter SKU code..."
              className="border border-gray-300 text-xs px-2 h-8 w-44 rounded-l placeholder-gray-400 focus:outline-none focus:border-gray-500 transition text-gray-700"
              value={draftFilters.by_sku_code || ""}
              onChange={(e) =>
                setDraftFilters((prev) => ({ ...prev, by_sku_code: e.target.value, by_product_sku: "" }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && draftFilters.by_sku_code?.trim()) onApply();
              }}
            />
            <span
              onClick={() => { if (draftFilters.by_sku_code?.trim()) onApply(); }}
              className="h-8 px-2 bg-primary flex items-center border border-gray-300 border-l-0 rounded-r cursor-pointer hover:scale-105 transition"
            >
              <SearchIcon size={13} color="white" />
            </span>
          </div>
        )}

        {/* APPLY */}
        {isDirty && (
          <button
            onClick={onApply}
            className="flex items-center text-xs gap-1 h-8 px-3 border border-primary text-primary rounded hover:scale-105 transition cursor-pointer"
          >
            <Check size={14} />
            Apply
          </button>
        )}

        {/* CLEAR */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex text-xs items-center gap-1 h-8 px-3 border border-gray-700 text-gray-700 rounded hover:scale-105 transition cursor-pointer"
          >
            <FilterX size={14} />
            Clear Filters
          </button>
        )}

      </div>
    </div>
  );
}