"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export default function SkuSearchDropdown({ value, onChange, allSkus, excludeIds = [], placeholder = "Search & select SKU" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  const selected = allSkus.find((s) => s.id === value) ?? null;

  // Available options: exclude already selected in other rows
  const available = allSkus.filter(
    (s) => !excludeIds.includes(s.id) || s.id === value
  );

  const filtered = available.filter((s) =>
    s.sku_name.toLowerCase().includes(query.toLowerCase()) ||
    s.sku_code.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto focus search when opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = (sku) => {
    onChange(sku.id);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setQuery("");
  };

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full h-9 px-3 flex items-center justify-between gap-2 rounded-md border text-[13px] transition-all bg-white
          ${open ? "border-blue-500 ring-2 ring-blue-50" : "border-gray-200 hover:border-gray-300"}
          ${!selected ? "text-gray-300" : "text-gray-800"}`}
      >
        <span className="truncate text-left">
          {selected ? selected.sku_name : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected && (
            <span onClick={handleClear} className="w-4 h-4 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400">
              <X size={11} strokeWidth={2.5} />
            </span>
          )}
          <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-100">
            <Search size={13} className="text-gray-400 flex-shrink-0" strokeWidth={1.8} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SKU name or code…"
              className="flex-1 text-[12.5px] outline-none text-gray-700 placeholder:text-gray-400"
            />
          </div>

          {/* Options */}
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-[12px] text-gray-400 text-center">No SKUs found</div>
            ) : (
              filtered.map((sku) => (
                <button
                  key={sku.id}
                  type="button"
                  onClick={() => handleSelect(sku)}
                  className={`w-full text-left px-3 py-2 text-[12.5px] transition-colors hover:bg-blue-50
                    ${sku.id === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
                >
                  <p className="truncate font-medium">{sku.sku_name}</p>
                  <p className="text-[11px] text-gray-400">{sku.sku_code}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}