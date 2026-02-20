"use client";

/**
 * Dropdown – a reusable, portal-rendered dropdown component.
 *
 * Props:
 *   value         : string | null           – currently selected option value
 *   onChange      : (value: string) => void – called on selection
 *   options       : Array<{ value, label }> – list of options
 *   placeholder   : string                  – placeholder when nothing selected
 *   hasError      : boolean                 – red border state
 *   disabled      : boolean
 *   className     : string                  – extra classes for the trigger button
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function NormalDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  hasError = false,
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const selectedItemRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  // ── Position menu via portal ───────────────────────────────────────────────
  const positionMenu = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuMaxH = 240;

    if (spaceBelow >= 120 || spaceBelow >= spaceAbove) {
      // open downward
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: Math.min(menuMaxH, spaceBelow - 8),
      });
    } else {
      // open upward
      setMenuStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: Math.min(menuMaxH, spaceAbove - 8),
      });
    }
  }, []);

  const openMenu = () => {
    if (disabled) return;
    positionMenu();
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  // Auto-scroll to selected item when menu opens
  useEffect(() => {
    if (open && selectedItemRef.current) {
      // slight delay to let the portal render first
      setTimeout(() => {
        selectedItemRef.current?.scrollIntoView({ block: "nearest" });
      }, 0);
    }
  }, [open]);

  // Reposition on scroll / resize while open
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

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") closeMenu(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (val) => {
    onChange(val);
    closeMenu();
  };

  // ── Trigger styles ─────────────────────────────────────────────────────────
  const triggerCls = [
    "h-9 w-full flex items-center justify-between px-3 text-[13px] rounded-md border outline-none transition-all bg-white",
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : open
      ? "border-blue-500 ring-2 ring-blue-50"
      : "border-gray-200 hover:border-gray-300",
    className,
  ]
    .filter(Boolean)
    .join(" ");

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
          {selected ? selected.label : placeholder}
        </span>
        <span className="ml-2 flex-shrink-0 text-gray-400">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Portal menu — renders into document.body, never clips */}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-y-auto py-1"
          >
            {options.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-gray-400">
                No options available
              </div>
            ) : (
              options.map((o) => {
                const isSelected = o.value === value;
                return (
                  <button
                    key={o.value}
                    ref={isSelected ? selectedItemRef : null}
                    type="button"
                    onClick={() => handleSelect(o.value)}
                    className={`w-full text-left px-3 py-2 text-[13px] transition-colors
                      ${
                        isSelected
                          ? "text-blue-600 font-semibold bg-blue-50 hover:bg-blue-100"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {o.label}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </>
  );
}