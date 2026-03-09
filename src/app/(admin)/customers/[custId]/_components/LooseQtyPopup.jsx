import { useState } from "react";
import { toast } from "react-toastify";
import { X, Box } from "lucide-react";

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

/**
 * mode: "new" | "existing" | "standalone-loose"
 *
 * ── "existing" (bundle line item from cart_summary) ──────────────────────────
 *   item = bundle cart_line_item
 *   item.product_sku.bundle_factor  → bundle factor
 *   item.loose_sku                  → loose SKU details (always present)
 *   item.loose_item?.quantity       → current loose qty (absent if none set yet)
 *   item.quantity                   → current bundle qty
 *
 * ── "new" (bundle SKU being added, not yet in cart) ──────────────────────────
 *   item = newItem { sku, quantity, _looseQty }
 *   item.sku.bundle_factor          → bundle factor
 *   item.sku.loose_sku              → loose SKU details
 *   item.quantity                   → current bundle qty
 *   item._looseQty                  → current loose qty
 *
 * ── "standalone-loose" (loose line item with no bundle parent) ───────────────
 *   item = loose cart_line_item
 *   item.bundle_sku                 → parent bundle SKU details (bundle_factor lives here)
 *   item.product_sku                → this IS the loose SKU
 *   item.quantity                   → current loose qty → shown in loose input, bundle = 0
 *   No loose qty cap — user enters any qty, backend splits into bundle + loose
 */
export function LooseQtyPopup({ mode = "new", item, onClose, onConfirm }) {
  const isExisting = mode === "existing";
  const isStandaloneLose = mode === "standalone-loose";
  const isNew = mode === "new";

  // ── Bundle SKU info ───────────────────────────────────────────────────────
  const bundleFactor = isExisting
    ? Number(item.product_sku?.bundle_factor)
    : isStandaloneLose
      ? Number(item.bundle_sku?.bundle_factor)
      : Number(item.sku?.bundle_factor);

  // Header label — show bundle SKU name
  const skuName = isExisting
    ? (item.product_sku?.sku_name || "—")
    : isStandaloneLose
      ? (item.bundle_sku?.sku_name || "—")
      : (item.sku?.sku_name || "—");

  // ── Loose SKU details ─────────────────────────────────────────────────────
  // existing:         item.loose_sku (always present on bundle line item)
  // new:              item.sku.loose_sku
  // standalone-loose: item itself IS the loose line item, product_sku has the details
  const looseSku = isExisting
    ? (item.loose_sku ?? null)
    : isStandaloneLose
      ? {
        sku_name: item.product_sku?.sku_name,
        sku_code: item.product_sku?.sku_code,
        mrp: item.mrp,
        unit_price: item.unit_price,
        selling_unit_price: item.selling_unit_price,
        selling_price: item.selling_price,
      }
      : (item.sku?.loose_sku ?? null);

  // ── Initial quantities ────────────────────────────────────────────────────
  // standalone-loose: bundle = 0, loose = item.quantity
  // existing:         bundle = item.quantity, loose = item.loose_item?.quantity
  // new:              bundle = item.quantity,  loose = item._looseQty
  const initialBundleQty = isStandaloneLose
    ? (Number(item._bundleQty) || 0)   // ← preserve whatever was saved before
    : (Number(item.quantity) || 0);
  const initialLooseQty = isStandaloneLose
    ? (Number(item.quantity) || 0)
    : isExisting
      ? (Number(item.loose_item?.quantity) || 0)
      : (Number(item._looseQty) || 0);

  const [bundleInput, setBundleInput] = useState(
    initialBundleQty > 0 ? String(initialBundleQty) : ""
  );
  const [looseInput, setLooseInput] = useState(
    initialLooseQty > 0 ? String(initialLooseQty) : ""
  );

  // ── Derived ───────────────────────────────────────────────────────────────
  const liveBundleQty = Math.max(0, parseInt(bundleInput, 10) || 0);
  const liveLooseQty = Math.max(0, parseInt(looseInput, 10) || 0);
  const bundleUnits = liveBundleQty * bundleFactor;
  const totalQty = bundleUnits + liveLooseQty;
  const hasAnyInput =
    (bundleInput !== "" && liveBundleQty > 0) ||
    (looseInput !== "" && liveLooseQty > 0);

  const looseFinalAmount =
    looseSku?.selling_unit_price && liveLooseQty > 0
      ? liveLooseQty * parseFloat(looseSku.selling_unit_price)
      : null;

  // ── Loose qty cap (only for bundle/new modes, not standalone-loose) ───────
  // For standalone-loose: user types any qty, backend does the bundle/loose split
  const handleLooseChange = (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= bundleFactor) {
      toast.error(
        `Loose qty must be less than bundle factor (${bundleFactor}). Valid range: 0 – ${bundleFactor - 1}.`,
        { toastId: "loose-cap" }
      );
      setLooseInput(String(bundleFactor - 1));
      return;
    }
    setLooseInput(val);
  };

  const handleConfirm = () => {
    onConfirm(liveBundleQty, liveLooseQty);
    onClose();
  };

  const looseColumns = [
    "SKU NAME",
    "SKU CODE",
    "QUANTITY",
    "MRP",
    "UNIT PRICE",
    "SELLING UNIT PRICE",
    "SELLING PRICE",
    "FINAL AMOUNT",
  ];

  // Header title
  const headerTitle = isStandaloneLose
    ? (initialLooseQty > 0 ? "Edit Qty" : "Set Qty")
    : (initialLooseQty > 0 ? "Edit Loose SKU" : "Set Loose SKU");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleConfirm} />

      <style>{`
        @keyframes lqFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
      `}</style>

      <div
        className="relative bg-white rounded-xl shadow-2xl overflow-hidden"
        style={{ width: "65%", animation: "lqFadeIn 0.16s ease-out" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Box className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-semibold text-gray-700">{headerTitle}</span>
            <span className="text-gray-300 text-xs mx-0.5">·</span>
            <span className="text-xs text-gray-400 truncate" style={{ maxWidth: 420 }}>
              {skuName}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">

          {/* ── Bundle qty + summary banner ── */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-center gap-6">
            {/* Bundle input */}
            <div className="flex items-center gap-2">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Bundle Qty</p>
                <input
                  type="number"
                  min={0}
                  value={bundleInput}
                  onChange={(e) => setBundleInput(e.target.value)}
                  placeholder="0"
                  style={{ width: 64 }}
                  className="px-2 py-1 text-sm font-bold text-primary bg-white border border-blue-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/10 transition-all"
                  onWheel={(e) => e.target.blur()}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                />
              </div>
              <span className="text-gray-400 text-sm mt-4">× {bundleFactor} = {bundleUnits}</span>
            </div>

            <span className="text-blue-300 text-base font-light mt-3">+</span>

            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Loose Units</p>
              <p className="text-sm font-semibold text-gray-700 tabular-nums pt-1">{liveLooseQty}</p>
            </div>

            <span className="text-blue-300 text-base font-light mt-3">=</span>

            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Total Qty</p>
              <p className="text-xl font-bold text-primary tabular-nums">{totalQty}</p>
            </div>

            <div className="ml-auto text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Bundle factor</p>
              <p className="text-xl font-bold text-primary tabular-nums">{bundleFactor}</p>
            </div>
          </div>

          {/* ── Loose SKU table ── */}
          <div className="rounded-xl border border-blue-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-100">
                  {looseColumns.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-left text-[10px] text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-blue-50/40 transition-colors">
                  {/* SKU NAME */}
                  <td className="px-3 py-3 text-sm font-medium text-gray-800" style={{ width: 160 }}>
                    {looseSku?.sku_name || "—"}
                  </td>
                  {/* SKU CODE */}
                  <td className="px-3 py-3" style={{ width: 130 }}>
                    {looseSku?.sku_code ? (
                      <span className="text-xs font-mono text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                        {looseSku.sku_code}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>
                  {/* QUANTITY input */}
                  <td className="px-3 py-3" style={{ width: 120 }}>
                    <div className="flex flex-col gap-1">
                      <input
                        type="number"
                        min={0}
                        // cap only applies for bundle/new modes
                        max={bundleFactor - 1}
                        value={looseInput}
                        onChange={(e) => handleLooseChange(e.target.value)}
                        placeholder="0"
                        style={{ width: 80 }}
                        className="px-2.5 py-1.5 text-sm border border-blue-200 rounded-lg outline-none focus:ring-1 focus:ring-primary transition-all"
                        onWheel={(e) => e.target.blur()}
                        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                      />
                      <p className="text-[10px] text-gray-400 font-medium leading-tight">
                        0 – {bundleFactor - 1}
                      </p>

                    </div>
                  </td>
                  {/* MRP */}
                  <td className="px-3 py-3 text-sm text-gray-600 tabular-nums" style={{ width: 80 }}>
                    {fmt(looseSku?.mrp)}
                  </td>
                  {/* UNIT PRICE */}
                  <td className="px-3 py-3 text-sm text-gray-600 tabular-nums" style={{ width: 80 }}>
                    {fmt(looseSku?.unit_price)}
                  </td>
                  {/* SELLING UNIT PRICE */}
                  <td className="px-3 py-3 text-sm text-gray-600 tabular-nums" style={{ width: 90 }}>
                    {fmt(looseSku?.selling_unit_price)}
                  </td>
                  {/* SELLING PRICE */}
                  <td className="px-3 py-3 text-sm text-gray-600 tabular-nums" style={{ width: 80 }}>
                    {fmt(looseSku?.selling_price)}
                  </td>
                  {/* FINAL AMOUNT — live */}
                  <td className="px-3 py-3" style={{ width: 100 }}>
                    <span className={`text-sm font-semibold tabular-nums transition-colors duration-200 ${looseFinalAmount != null ? "text-primary" : "text-gray-300"
                      }`}>
                      {looseFinalAmount != null ? fmt(looseFinalAmount) : "—"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Actions ── */}
          {/* <div className="flex justify-center gap-3 pt-1 pb-1">
            <button
              onClick={onClose}
              style={{ width: 144 }}
              className="py-2 text-sm rounded-lg border border-gray-200 text-gray-600 cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasAnyInput}
              style={{ width: 144 }}
              className="py-2 text-sm rounded-lg bg-primary cursor-pointer text-white font-medium hover:opacity-80 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div> */}

        </div>
      </div>
    </div>
  );
}