"use client";
import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronUp, ChevronDown } from "lucide-react";

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function toDateStr(date) {
  if (!date) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

/**
 * DatePicker
 * Props:
 *  - label, required
 *  - value: Date | null
 *  - onChange: fn(Date | null)
 *  - disablePast: bool  — disables dates before today
 *  - disableFuture: bool — disables dates after today
 *  - readOnly: bool — shows value but not clickable
 *  - error: string
 *  - dropUp: bool
 */
export default function DatePicker({
  label,
  required,
  value,
  onChange,
  disablePast = false,
  disableFuture = false,
  readOnly = false,
  error,
  dropUp = false,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState((value || today).getFullYear());
  const [viewMonth, setViewMonth] = useState((value || today).getMonth());
  const [mode, setMode] = useState("days");
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setMode("days");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [value]);

  // ── helpers ────────────────────────────────────────────────────────────────
  const isPastMonth = (y, m) => {
    if (!disablePast) return false;
    return y < today.getFullYear() || (y === today.getFullYear() && m < today.getMonth());
  };

  const isFutureMonth = (y, m) => {
    if (!disableFuture) return false;
    return y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth());
  };

  const isDayDisabled = (year, month, day) => {
    const d = new Date(year, month, day);
    if (disablePast && d < today) return true;
    if (disableFuture && d > today) return true;
    return false;
  };

  const isYearDisabled = (y) => {
    if (disablePast && y < today.getFullYear()) return true;
    if (disableFuture && y > today.getFullYear()) return true;
    return false;
  };

  const isMonthDisabled = (y, m) => {
    if (isPastMonth(y, m)) return true;
    if (isFutureMonth(y, m)) return true;
    return false;
  };

  // ── navigation ─────────────────────────────────────────────────────────────
  const prevMonth = () => {
    let m = viewMonth - 1;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (isPastMonth(y, m)) return;
    setViewMonth(m);
    setViewYear(y);
  };

  const nextMonth = () => {
    let m = viewMonth + 1;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (isFutureMonth(y, m)) return;
    setViewMonth(m);
    setViewYear(y);
  };

  const selectDay = (cell) => {
    const { year, month, day } = cell;
    if (isDayDisabled(year, month, day)) return;
    const d = new Date(year, month, day);
    if (cell.overflow) { setViewYear(year); setViewMonth(month); }
    onChange(d);
    setOpen(false);
    setMode("days");
  };

  const selectMonth = (mIdx) => {
    if (isMonthDisabled(viewYear, mIdx)) return;
    setViewMonth(mIdx);
    setMode("days");
  };

  const selectYear = (y) => {
    if (isYearDisabled(y)) return;
    setViewYear(y);
  };

  // ── calendar grid ──────────────────────────────────────────────────────────
  const buildCells = () => {
    const daysInCurrent = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    let prevM = viewMonth - 1; let prevY = viewYear;
    if (prevM < 0) { prevM = 11; prevY--; }
    const daysInPrev = getDaysInMonth(prevY, prevM);
    let nextM = viewMonth + 1; let nextY = viewYear;
    if (nextM > 11) { nextM = 0; nextY++; }
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, month: prevM, year: prevY, overflow: "prev" });
    for (let d = 1; d <= daysInCurrent; d++) cells.push({ day: d, month: viewMonth, year: viewYear, overflow: null });
    let nextDay = 1;
    while (cells.length < 42) cells.push({ day: nextDay++, month: nextM, year: nextY, overflow: "next" });
    return cells;
  };

  const cells = buildCells();

  const isToday = (cell) =>
    cell.day === today.getDate() &&
    cell.month === today.getMonth() &&
    cell.year === today.getFullYear();

  const isSelected = (cell) =>
    value &&
    cell.day === value.getDate() &&
    cell.month === value.getMonth() &&
    cell.year === value.getFullYear();

  // Year range: past 5 → future 5, clamped by disablePast / disableFuture
  const startYear = disablePast ? today.getFullYear() : today.getFullYear() - 5;
  const endYear   = disableFuture ? today.getFullYear() : today.getFullYear() + 5;
  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  const canGoPrev = !isPastMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1
  );

  const canGoNext = !isFutureMonth(
    viewMonth === 11 ? viewYear + 1 : viewYear,
    viewMonth === 11 ? 0 : viewMonth + 1
  );

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => { if (!readOnly) setOpen((p) => !p); }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors
          ${readOnly ? "bg-gray-50 cursor-default border-gray-200" : "bg-white"}
          ${!readOnly && error ? "border-red-400" : !readOnly ? "border-gray-300" : ""}
        `}
        style={open && !readOnly ? { borderColor: "#4f46e5" } : {}}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? toDateStr(value) : "dd-mm-yyyy"}
        </span>
        {!readOnly && <Calendar size={16} className="text-gray-400 shrink-0 cursor-pointer hover:text-gray-700" />}
      </button>

      {open && !readOnly && (
        <div
          className={`absolute z-50 bg-white border border-gray-200 rounded-lg w-60 ${dropUp ? "bottom-full mb-1" : "top-full mt-1"}`}
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
        >
          {/* Month / Year nav */}
          <div className="flex items-center justify-between px-4 py-1 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setMode(mode === "days" ? "months" : "days")}
              className="font-semibold text-sm text-gray-800 hover:text-primary flex items-center gap-1 cursor-pointer"
            >
              {MONTH_NAMES[viewMonth]}, {viewYear}
              <ChevronDown size={14} />
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={prevMonth}
                disabled={!canGoPrev}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp size={16} className="text-gray-600 hover:text-primary" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                disabled={!canGoNext}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown size={16} className="text-gray-600 hover:text-primary" />
              </button>
            </div>
          </div>

          {/* Month / Year picker */}
          {mode === "months" ? (
            <div className="p-1">
              <div className="mb-3 max-h-28 overflow-y-auto flex flex-col gap-0.5">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => selectYear(y)}
                    disabled={isYearDisabled(y)}
                    className={`text-sm px-3 py-1 rounded text-left transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      y === viewYear ? "font-bold bg-indigo-50" : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={y === viewYear ? { color: "#1e40af" } : {}}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {MONTHS.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectMonth(idx)}
                    disabled={isMonthDisabled(viewYear, idx)}
                    className={`text-xs py-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      idx === viewMonth ? "font-bold text-white" : "text-gray-700 hover:bg-indigo-50"
                    }`}
                    style={idx === viewMonth ? { backgroundColor: "#1e40af" } : {}}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Day grid */
            <div className="p-1">
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.1">
                {cells.map((cell, i) => {
                  const dis = isDayDisabled(cell.year, cell.month, cell.day);
                  const sel = isSelected(cell);
                  const tod = isToday(cell);
                  const over = !!cell.overflow;
                  let textColor = "#1f2937";
                  if (sel) textColor = "#fff";
                  else if (dis) textColor = "#d1d5db";
                  else if (over) textColor = "#9ca3af";
                  else if (tod) textColor = "#4f46e5";
                  return (
                    <div key={i} className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => !dis && selectDay(cell)}
                        disabled={dis}
                        className={`w-8 h-8 rounded-full text-sm transition-colors ${
                          dis ? "cursor-not-allowed" : "cursor-pointer"
                        } ${!sel && !dis ? (over ? "hover:bg-gray-50" : "hover:bg-blue-50") : ""}`}
                        style={{
                          backgroundColor: sel ? "#1e40af" : undefined,
                          outline: tod && !sel ? "2px solid #1e40af" : undefined,
                          outlineOffset: "-2px",
                          color: textColor,
                          fontWeight: sel ? 600 : undefined,
                        }}
                      >
                        {cell.day}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-1 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); setMode("days"); }}
              className="text-xs hover:underline text-primary cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => { onChange(new Date(today)); setOpen(false); setMode("days"); }}
              className="text-xs hover:underline text-primary cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}