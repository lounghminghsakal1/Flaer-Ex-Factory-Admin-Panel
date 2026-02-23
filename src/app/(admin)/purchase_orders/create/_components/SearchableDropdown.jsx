"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

/**
 * SearchableDropdown
 * Props:
 *  - label, required, placeholder
 *  - options: [{ value, label }]
 *  - value: { value, label } | null
 *  - onChange: fn(option)
 *  - onSearch: fn(query)
 *  - loading: bool
 *  - disabled: bool        — grayed out, not clickable
 *  - readOnly: bool        — looks normal but not clickable (for locked view mode)
 *  - optionsMaxHeight: number (px, default 220)
 *  - error: string
 *  - dropUp: bool — open dropdown upward instead of downward
 */
export default function SearchableDropdown({
  label,
  required,
  placeholder = "Select...",
  options = [],
  value,
  onChange,
  onSearch,
  loading = false,
  disabled = false,
  readOnly = false,
  optionsMaxHeight = 220,
  error,
  dropUp = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleOpen = () => {
    if (disabled || readOnly) return;
    const next = !open;
    setOpen(next);
    if (next) {
      setQuery("");
      if (onSearch) onSearch("");
    }
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (onSearch) onSearch(q);
  };

  const handleSelect = (option) => {
    onChange(option);
    setOpen(false);
    setQuery("");
  };

  const isLocked = disabled || readOnly;

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors
          ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200" : "bg-white"}
          ${readOnly ? "bg-gray-50 cursor-default border-gray-200" : ""}
          ${!isLocked ? "cursor-pointer" : ""}
          ${error ? "border-red-400" : !isLocked ? "border-gray-300" : ""}
        `}
        style={open ? { borderColor: "#4f46e5" } : {}}
      >
        <span className={`truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {value ? value.label : placeholder}
        </span>
        {!readOnly && (
          <ChevronDown
            size={16}
            className={`text-gray-500 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Dropdown panel */}
      {open && !isLocked && (
        <div
          className={`absolute z-[100] w-full bg-white border border-gray-200 rounded-md ${dropUp ? "bottom-full mb-1" : "top-full mt-1"}`}
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-gray-200 bg-gray-50">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleSearch}
                placeholder="Search..."
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto" style={{ maxHeight: optionsMaxHeight }}>
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">Loading...</div>
            ) : options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No options found</div>
            ) : (
              options.map((option) => {
                const selected = value?.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors"
                    style={selected ? { backgroundColor: "#eef2ff", color: "#4338ca" } : { color: "#374151" }}
                    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "#f5f3ff"; }}
                    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.backgroundColor = ""; }}
                  >
                    <span className="truncate">{option.label}</span>
                    {selected && <Check size={14} className="shrink-0 ml-2" style={{ color: "#4338ca" }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}