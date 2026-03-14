"use client";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import SearchableDropdown from "./_components/SearchableDropdown";
import DatePicker from "./_components/DatePicker";
import POLineItems from "./_components/POLineItems";
import HeaderWithBack from "../../../../../components/shared/HeaderWithBack";
import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import { Save, Ship } from "lucide-react";

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
  const [orderId, setOrderId] = useState("");
  const [shipmentId, setShipmentId] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDropShipment = searchParams.get("fromDropShipment");

  const isDropShipmentFlow = fromDropShipment === "true";

  const isFormValid = useMemo(
    () => checkFormValid(vendor, deliveryDate, rows),
    [vendor, deliveryDate, rows]
  );

  useEffect(() => {
    if (!isDropShipmentFlow) return;
    const data = sessionStorage.getItem("dropShipmentData");
    if (!data) return;

    const dropShipmentData = JSON.parse(data);
    const { vendor_id, line_items } = dropShipmentData.shipment;
    console.log(dropShipmentData);
    setVendor({
      value: vendor_id,
      label: dropShipmentData.shipment.vendor_name ?? "Vendor"
    });

    setVendorOptions([
      {
        value: vendor_id,
        label: dropShipmentData.shipment.vendor_name ?? "Vendor"
      }
    ]);
    if (line_items && line_items.length > 0) {
      const autoFilledRows = line_items.map(li => ({
        skuOption: {
          value: li.order_line_item_id,
          label: li.sku_name ?? "SKU"
        },
        skuCode: li.sku_code ?? "SKU CODE",
        totalUnits: Number(li.quantity),
        unitPrice: Number(li.unit_price)
      }));
      setRows(autoFilledRows);
    }
    setOrderId(dropShipmentData.shipment.order_id);
    setShipmentId(dropShipmentData.shipment.drop_shipment_id);

    sessionStorage.removeItem("dropShipmentData");

  }, [isDropShipmentFlow])

  const fetchVendors = useCallback((query = "") => {
    if (isDropShipmentFlow) return;
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
          toast.error("Failed to fetch vendors data " + err.message);
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
        const params = new URLSearchParams(searchParams.toString());
        params.delete("tab");
        params.set("return-order-id", orderId);
        params.set("return-shipment-id", shipmentId);
        router.push(`/purchase_orders/${data.data.id}?${params.toString()}`);
        return;
      } else {
        throw new Error(data?.errors?.[0] ?? "Something went wrong")
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save purchase order " + err.message);
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="px-2 py-4 space-y-2">
      <HeaderWithBack title="Create Purchase Order" onBack={() => router.push("/purchase_orders")} />

      <div className="text-right m-3 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isFormValid || saving}
          className={`flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer disabled:cursor-not-allowed ${isFormValid && !saving ? "bg-green-700 hover:bg-green-800" : "bg-gray-400/90"
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
              disabled={isDropShipmentFlow}
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


        {isDropShipmentFlow && (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mt-4 bg-purple-700/10 border border-primary/20">
            <Ship className="w-4 h-4 text-purple-700 shrink-0" />
            <span className="text-sm font-semibold text-purple-700">Drop Shipment</span>
            <span className="text-[12px] font-mono font-bold text-purple-700/70 bg-purple-700/10 px-1.5 py-0.5 rounded-md">{shipmentId}</span>
          </span>
        )}

      </div>

      {/* PO Line Items */}
      <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 m-4">
        <POLineItems
          vendorId={vendor?.value || null}
          rows={rows}
          onChange={setRows}
          readOnly={isDropShipmentFlow}
          editMode={!isDropShipmentFlow}
        />
      </div>
    </div>
  );
}