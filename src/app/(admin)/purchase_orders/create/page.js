"use client";
import { useState, useCallback, useRef, useMemo } from "react";
import SearchableDropdown from "./_components/SearchableDropdown";
import DatePicker from "./_components/DatePicker";
import POLineItems from "./_components/POLineItems";
import HeaderWithBack from "../../../../../components/shared/HeaderWithBack";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Save } from "lucide-react";

function toApiDateStr(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function checkFormValid(vendor, deliveryDate, rows) {
  if (!vendor) return false;
  if (!deliveryDate) return false;
  if (!rows || rows.length === 0) return false;
  for (const row of rows) {
    if (!row.skuOption) return false;
    const units = parseInt(row.totalUnits, 10);
    if (!row.totalUnits || isNaN(units) || units < 1) return false;
  }
  return true;
}

export default function CreatePurchaseOrderForm() {
  const [vendor, setVendor] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);
  const [rows, setRows] = useState([]);
  const [vendorOptions, setVendorOptions] = useState([]);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchTimeout = useRef(null);

  const router = useRouter();

  const isFormValid = useMemo(
    () => checkFormValid(vendor, deliveryDate, rows),
    [vendor, deliveryDate, rows]
  );

  const fetchVendors = useCallback((query = "") => {
    setVendorLoading(true);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors?only_names=true&starts_with=${encodeURIComponent(query)}`;
      fetch(url)
        .then((r) => r.json())
        .then((res) => {
          if (res.status === "success")
            setVendorOptions(res.data.map((v) => ({ value: v.id, label: v.firm_name })));
          else throw new Error(res?.errors?.[0] ?? "Something went wrong")
        })
        .catch((err) => {
          console.log(err);
          toast.error("Failed to fetch vendors data "+err.message);
        })
        .finally(() => setVendorLoading(false));
    }, 300);
  }, []);

  const handleVendorChange = (opt) => {
    setVendor(opt);
    setRows([]);
  };

  const handleSave = async () => {
    if (!isFormValid || saving) return;
    setSaving(true);
    try {
      const payload = {
        purchase_order: {
          vendor_id: vendor.value,
          delivery_date: toApiDateStr(deliveryDate),
          ...(expiryDate ? { expiry_date: toApiDateStr(expiryDate) } : {}),
          po_line_items: rows.map((r) => ({
            product_sku_id: r.skuOption.value,
            total_units: parseInt(r.totalUnits, 10),
            unit_price: parseFloat(r.unitPrice),
          })),
        },
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/purchase_orders`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Purchase order created successfully");
        router.push(`/purchase_orders/${data.data.id}`);
        return;
      } else {
        throw new Error(data?.errors?.[0] ?? "Something went wrong")
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save purchase order "+err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-2 py-4 space-y-2">
      <HeaderWithBack title="Create Purchase Order" onBack={() => router.push("/purchase_orders")} />

      {/* Save button — top right */}
      <div className="text-right m-3 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isFormValid || saving}
          className={`flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer disabled:cursor-not-allowed ${
            isFormValid && !saving ? "bg-green-700 hover:bg-green-800" : "bg-gray-400/90"
          }`}
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Purchase Order"}
        </button>
      </div>

      {/* Form fields */}
      <div className="flex items-start justify-between gap-4 m-4">
        <div className="flex items-end gap-4 flex-wrap">
          {/* Vendor */}
          <div className="w-60">
            <SearchableDropdown
              label="Select Vendor"
              required
              placeholder="Select..."
              options={vendorOptions}
              value={vendor}
              onChange={handleVendorChange}
              onSearch={fetchVendors}
              loading={vendorLoading}
              optionsMaxHeight={220}
            />
          </div>

          {/* Delivery Date */}
          <div className="w-60">
            <DatePicker
              label="Expected Delivery Date"
              required
              value={deliveryDate}
              onChange={setDeliveryDate}
              disablePast={true}
            />
          </div>

          {/* Expiry Date */}
          <div className="w-60">
            <DatePicker
              label="Expiry Date"
              value={expiryDate}
              onChange={setExpiryDate}
              disablePast={false}
            />
          </div>
        </div>
      </div>

      {/* PO Line Items */}
      <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 m-4">
        <POLineItems
          vendorId={vendor?.value || null}
          rows={rows}
          onChange={setRows}
          readOnly={false}
          editMode={false}
        />
      </div>
    </div>
  );
}