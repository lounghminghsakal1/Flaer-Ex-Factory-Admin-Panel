"use client";

/**
 * SkuDropdown – a reusable, portal-rendered searchable dropdown.
 *
 * Props:
 *   value        : string | null          – currently selected id
 *   onChange     : (id: string) => void   – called on selection
 *   options      : Array<{ id, name, subLabel? }> – full option list
 *   excludeIds   : string[]               – ids to hide from list
 *   placeholder  : string                 – trigger placeholder text
 *   searchPlaceholder : string            – search input placeholder
 *   hasError     : boolean                – red border state
 *   disabled     : boolean
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, ChevronUp, X } from "lucide-react";

export default function SkuDropdown({
  value,
  onChange,
  options = [],
  excludeIds = [],
  placeholder = "Search & select…",
  searchPlaceholder = "Search…",
  hasError = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find((o) => o.id === value);

  // ── Position menu via portal ──────────────────────────────────────────
  const positionMenu = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuH = 260; // max height of dropdown
    const width = rect.width;

    if (spaceBelow >= menuH || spaceBelow >= spaceAbove) {
      // open downward
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width,
        zIndex: 99999,
        maxHeight: Math.min(menuH, spaceBelow - 8),
      });
    } else {
      // open upward
      setMenuStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width,
        zIndex: 99999,
        maxHeight: Math.min(menuH, spaceAbove - 8),
      });
    }
  }, []);

  const openMenu = () => {
    if (disabled) return;
    positionMenu();
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
    setSearch("");
  };

  // Focus search when menu opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const reposition = () => positionMenu();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, positionMenu]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = options.filter(
    (o) =>
      !excludeIds.includes(o.id) &&
      (o.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.subLabel?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (id) => {
    onChange(id);
    closeMenu();
  };

  // ── Trigger button ────────────────────────────────────────────────────
  const triggerCls = [
    "h-9 w-full flex items-center justify-between px-3 text-[13px] rounded-md border outline-none transition-all bg-white",
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : open
      ? "border-blue-500 ring-2 ring-blue-50"
      : "border-gray-200 hover:border-gray-300",
  ].join(" ");

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={open ? closeMenu : openMenu}
        className={triggerCls}
      >
        <span className={`truncate ${selected ? "text-gray-800" : "text-gray-300"}`}>
          {selected ? selected.name : placeholder}
        </span>
        <span className="ml-2 flex-shrink-0 text-gray-400">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Portal menu */}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <Search size={13} className="text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 text-[12.5px] outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Options */}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-5 text-center text-[12px] text-gray-400">
                  {search ? "No results match your search" : "No available options"}
                </div>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleSelect(o.id)}
                    className={`w-full text-left px-3 py-2 text-[12.5px] transition-colors hover:bg-blue-50 hover:text-blue-700
                      ${value === o.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
                  >
                    <div className="font-medium truncate">{o.name}</div>
                    {o.subLabel && (
                      <div className="text-[11px] text-gray-400 mt-0.5">{o.subLabel}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}