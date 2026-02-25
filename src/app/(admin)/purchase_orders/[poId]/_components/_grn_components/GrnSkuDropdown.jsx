"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search } from "lucide-react";

/**
 * GrnSkuDropdown
 * Uses position:fixed for the dropdown panel so it is never clipped
 * by ancestor overflow:hidden (e.g. inside a table).
 */
export default function GrnSkuDropdown({
  options = [],
  value,
  onChange,
  disabled = false,
  placeholder = "Select SKU...",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState({});
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => o.product_sku_id === value) || null;
  const filtered = options.filter((o) =>
    o.product_name.toLowerCase().includes(search.toLowerCase())
  );

  // Position the fixed panel under (or above) the trigger
  const positionPanel = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const goUp = spaceBelow < panelHeight && rect.top > panelHeight;

    setPanelStyle({
      position: "fixed",
      left: rect.left,
      width: Math.max(rect.width, 240),
      zIndex: 9999,
      ...(goUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Re-position on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    const update = () => positionPanel();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, positionPanel]);

  // Focus search input when panel opens
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    if (!open) positionPanel();
    setOpen((p) => !p);
    setSearch("");
  };

  const handleSelect = (option) => {
    if (option.remaining_quantity <= 0) return;
    onChange(option);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        title={selected ? selected.product_name : ""}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg border text-sm select-none transition-colors ${
          disabled
            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-default"
            : open
            ? "bg-white border-primary text-gray-800 cursor-pointer"
            : "bg-white border-gray-300 hover:border-primary text-gray-800 cursor-pointer"
        }`}
      >
        <span className={`truncate text-sm ${selected ? "text-gray-800" : "text-gray-400"}`}>
          {selected ? selected.product_name : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </div>

      {open && !disabled && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No SKUs found</div>
            ) : (
              filtered.map((option) => {
                const isAvailable = option.remaining_quantity > 0;
                const isSelected = option.product_sku_id === value;
                return (
                  <div
                    key={option.product_sku_id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    className={`px-3 py-2.5 transition-colors ${
                      isAvailable
                        ? isSelected
                          ? "bg-primary/10 cursor-pointer"
                          : "hover:bg-gray-50 cursor-pointer"
                        : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${isSelected ? "text-primary" : isAvailable ? "text-gray-800" : "text-gray-400"}`}>
                        {option.product_name}
                      </p>
                      {!isAvailable && (
                        <span className="text-xs text-red-400 shrink-0 bg-red-50 px-1.5 py-0.5 rounded-md font-medium">
                          Fully received
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-xs ${isAvailable ? "text-gray-400" : "text-gray-300"}`}>
                        Remaining: <span className={`font-semibold ${isAvailable ? "text-gray-600" : "text-gray-300"}`}>{option.remaining_quantity}</span>
                      </span>
                      <span className={`text-xs ${isAvailable ? "text-gray-400" : "text-gray-300"}`}>
                        Ordered: <span className={`font-semibold ${isAvailable ? "text-gray-600" : "text-gray-300"}`}>{option.ordered_quantity}</span>
                      </span>
                      {option.unit_price && (
                        <span className={`text-xs ${isAvailable ? "text-gray-400" : "text-gray-300"}`}>
                          ₹<span className={`font-semibold ${isAvailable ? "text-gray-600" : "text-gray-300"}`}>{Number(option.unit_price).toLocaleString()}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}