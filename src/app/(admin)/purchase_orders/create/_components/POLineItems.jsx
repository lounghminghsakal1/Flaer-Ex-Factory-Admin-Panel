"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import SearchableDropdown from "./SearchableDropdown";

const PRIMARY = "#4f46e5";

/**
 * POLineItems
 * Props:
 *  - vendorId: number | null
 *  - rows: [{ id (optional=existing), skuOption, skuCode, unitPrice, totalUnits }]
 *  - onChange: fn(rows)
 *  - readOnly: bool — all fields locked, no add/delete
 *  - editMode: bool — units editable, sku/price locked, can add new rows, can delete rows
 *  (if neither readOnly nor editMode: full creation mode — all fields editable)
 */
export default function POLineItems({ vendorId, rows, onChange, readOnly = false, editMode = false }) {
  const [skuOptions, setSkuOptions] = useState([]);
  const [loadingSkus, setLoadingSkus] = useState(false);
  const [filteredSkuOptions, setFilteredSkuOptions] = useState([]);

  useEffect(() => {
    setFilteredSkuOptions(skuOptions);
  }, [skuOptions]);

  useEffect(() => {
    if (!vendorId) { setSkuOptions([]); return; }
    setLoadingSkus(true);
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors/${vendorId}/sku_mappings?only_active=true`)
      .then((r) => r.json())
      .then((res) => {
        if (res.status === "success") {
          setSkuOptions(res.data.map((item) => ({
            value: item.product_sku.id,
            label: item.product_sku.sku_name,
            skuCode: item.product_sku.sku_code,
            unitPrice: parseFloat(item.vendor_unit_price),
          })));
        }
      })
      .catch(() => { })
      .finally(() => setLoadingSkus(false));
  }, [vendorId]);

  const selectedSkuIds = rows.map((r) => r.skuOption?.value).filter(Boolean);
  const availableOptions = (currentSkuId = null) =>
    skuOptions.filter((o) => o.value === currentSkuId || !selectedSkuIds.includes(o.value));

  const updateRow = (index, patch) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const deleteRow = (index) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...rows, { skuOption: null, skuCode: "", unitPrice: "", totalUnits: "" }]);
  };

  const handleSkuSelect = (index, option) => {
    updateRow(index, {
      skuOption: option,
      skuCode: option?.skuCode || "",
      unitPrice: option?.unitPrice ?? "",
    });
  };

  const handleUnitsChange = (index, val) => {
    const cleaned = val.replace(/[^0-9]/g, "");
    if (cleaned === "") { updateRow(index, { totalUnits: "" }); return; }
    const num = parseInt(cleaned, 10);
    if (num >= 1) updateRow(index, { totalUnits: String(num) });
  };

  const addDisabled = !vendorId;
  // In editMode: existing rows' SKU is locked, only units editable; new rows fully editable
  // In readOnly: everything locked
  // In creation: everything editable

  const handleSearch = (query, options) => {
    if (!query?.trim()) {
      setFilteredSkuOptions(options);
      return;
    }

    const filtered = options.filter((opt) =>
      opt.label?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredSkuOptions(filtered);
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-3 text-primary">PO Line Items</h2>

      <div className="border border-gray-200 rounded-lg overflow-visible">
        {/* Header */}
        <div className="grid bg-gray-50 border-b border-gray-200 rounded-t-lg" style={{ gridTemplateColumns: "2fr 1.2fr 1fr 120px 66px" }}>
          <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU Name</div>
          <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU Code</div>
          <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit Price</div>
          <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Units</div>
          <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Delete</div>
        </div>

        {/* Rows */}
        {rows.map((row, index) => {
          // existing row = has an id from API
          const isExistingRow = !!row.id;
          // SKU dropdown locked if: readOnly, OR editMode with existing row
          const skuLocked = readOnly || (editMode && isExistingRow);
          // Units locked if readOnly only
          const unitsLocked = readOnly;
          // Can delete if not readOnly
          const canDelete = !readOnly;

          return (
            <div key={row.id ?? `new-${index}`} className="grid border-b border-gray-100 last:border-b-0 items-center" style={{ gridTemplateColumns: "2fr 1.2fr 1fr 120px 66px" }}>
              {/* SKU Name */}
              <div className="px-3 py-2.5">
                {skuLocked ? (
                  <div className="px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700 truncate">
                    {row.skuOption?.label || "—"}
                  </div>
                ) : (
                  <SearchableDropdown
                    placeholder="Enter SKU Name"
                    options={
                      filteredSkuOptions.length
                        ? filteredSkuOptions.filter(
                          (opt) =>
                            opt.value === row.skuOption?.value ||
                            !selectedSkuIds.includes(opt.value)
                        )
                        : availableOptions(row.skuOption?.value)
                    }
                    value={row.skuOption}
                    onChange={(opt) => handleSkuSelect(index, opt)}
                    loading={loadingSkus}
                    optionsMaxHeight={180}
                    dropUp={true}
                    onSearch={(query) =>
                      handleSearch(query, availableOptions(row.skuOption?.value))
                    }
                  />
                )}
              </div>

              {/* SKU Code */}
              <div className="px-4 py-2.5">
                <span className="text-sm text-gray-500 break-all">
                  {row.skuCode || <span className="text-gray-300">—</span>}
                </span>
              </div>

              {/* Unit Price */}
              <div className="px-4 py-2.5">
                <span className="text-sm text-gray-500">
                  {row.unitPrice !== "" ? `₹ ${row.unitPrice}` : <span className="text-gray-300">—</span>}
                </span>
              </div>

              {/* Total Units */}
              <div className="px-3 py-2.5">
                {unitsLocked ? (
                  <div className="px-2 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
                    {row.totalUnits || "—"}
                  </div>
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.totalUnits}
                    onChange={(e) => handleUnitsChange(index, e.target.value)}
                    placeholder="Units"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md outline-none transition-colors"
                    onFocus={(e) => { e.target.style.borderColor = PRIMARY; }}
                    onBlur={(e) => { e.target.style.borderColor = "#d1d5db"; }}
                  />
                )}
              </div>

              {/* Delete */}
              <div className="flex justify-center py-2.5">
                {canDelete ? (
                  <button type="button" onClick={() => deleteRow(index)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                ) : (
                  <div className="p-1.5">
                    <Trash2 size={16} className="text-gray-200" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Item */}
        {!readOnly && (
          <div className="px-4 py-3 border-t flex items-center gap-1 border-gray-100">
            <Plus size={16} className={`${addDisabled ? "text-gray-300" : "text-primary"}`} />
            <button
              type="button"
              onClick={addRow}
              disabled={addDisabled}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors text-primary cursor-pointer hover:underline hover:text-primary/90 disabled:opacity-40 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Add Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}