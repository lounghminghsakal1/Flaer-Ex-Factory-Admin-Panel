"use client";

import { useEffect, useState, useRef } from "react";
import {
  Loader2, Plus, Save, ArrowLeft,
  ExternalLink, Truck, Trash2, ChevronDown, Search, Layers, Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import ShipmentDetail from "./ShipmentDetail";
import { useSearchParams, useRouter, usePathname, useParams } from "next/navigation";
import DropShipmentDetails from "./DropShipmentDetails";

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

function SearchableDropdown({
  placeholder = "Select option",
  options = [],
  value,
  onChange,
  searchPlaceholder = "Search...",
  disabled = false,
  emptyMessage = "No options found",
  valueKey = "id",
  labelKey = "name",
  renderOption,
  renderSelected,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filtered = options.filter((o) =>
    o[labelKey]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selected = options.find((o) => String(o[valueKey]) === String(value));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((p) => !p)}
        className={`w-full px-3 py-2 flex items-center justify-between text-left bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer hover:border-gray-300"}`}
      >
        <span className={selected ? "text-gray-800" : "text-gray-400"}>
          {selected ? (renderSelected ? renderSelected(selected) : selected[labelKey]) : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="p-3 text-center text-xs text-gray-400">{emptyMessage}</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt[valueKey]}
                  onClick={() => { onChange?.(opt[valueKey]); setIsOpen(false); setSearchQuery(""); }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors
                    ${String(opt[valueKey]) === String(value) ? "bg-primary/5 text-primary font-medium" : "text-gray-700"}`}
                >
                  {renderOption ? renderOption(opt) : opt[labelKey]}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Shipments({ orderId, shipmentIntent }) {
  const [view, setView] = useState(shipmentIntent ?? "list");
  const [selectedShipmentId, setSelectedShipmentId] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [intent, setIntent] = useState(searchParams.get("shipment-intent"));

  useEffect(() => {
    const urlIntent = searchParams.get("shipment-intent");
    if (urlIntent) setIntent(urlIntent);
  }, [searchParams]);

  useEffect(() => {
    const id = searchParams.get("shipment-id");
    if (id) {
      setSelectedShipmentId(Number(id));
    }
  }, [searchParams])

  const clearShipmentParams = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("shipment-id");
    params.delete("shipment-intent");

    router.push(`${pathname}?${params.toString()}`);
  };

  if (view === "forward") {
    return (
      <CreateForwardShipment
        orderId={orderId}
        onBack={() => setView("list")}
        onSuccess={() => setView("list")}
      />
    );
  }
  if (view === "drop") {
    return <CreateDropShipment orderId={orderId} onBack={() => setView("list")} onSuccess={() => setView("list")} />;
  }
  if (selectedShipmentId) {
    if (intent === "forward") {
      return <ShipmentDetail shipmentId={selectedShipmentId} onBack={() => { clearShipmentParams(); setSelectedShipmentId(null); }} />;
    }
    if (intent === "drop") {
      return <DropShipmentDetails shipmentId={selectedShipmentId} onBack={() => {clearShipmentParams(); setSelectedShipmentId(null);}} />;
    }
    if (intent === "reverse") {
      return <ShipmentDetail shipmentId={selectedShipmentId} onBack={() => {clearShipmentParams(); setSelectedShipmentId(null);}} />;
    }

  }
  return <ShipmentsList orderId={orderId} onSelectShipment={setSelectedShipmentId} setIntent={setIntent} />;
}

function ShipmentsList({ orderId, onSelectShipment, setIntent = null }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");


  const searchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();

  useEffect(() => {
    const url = orderId
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments?by_order=${orderId}`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments`;
    fetch(url)
      .then((r) => r.json())
      .then((json) => { if (json.status !== "failure") setShipments(json.data ?? []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  const typeOptions = ["All", ...new Set(shipments.map((s) => s.shipment_type).filter(Boolean))];
  const filtered = filter === "All" ? shipments : shipments.filter((s) => s.shipment_type === filter);

  const pushIdToUrl = (id, shipmentType) => {
    const params = new URLSearchParams(searchParams.toString());

    let intent = "forward";
    if (shipmentType === "drop_shipment") intent = "drop";
    if (shipmentType === "reverse_shipment") intent = "reverse";
    if (shipmentType === "forward_shipment") intent = "forward";

    params.set("tab", "shipments");   
    params.set("shipment-id", id);
    params.set("shipment-intent", intent);

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 mb-2">Filter</p>
        <div className="w-44">
          <SearchableDropdown
            placeholder="All"
            options={typeOptions.map((t) => ({ id: t, name: t === "All" ? "All" : formatLabel(t) }))}
            value={filter}
            onChange={(v) => setFilter(v)}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-xs text-gray-400">Loading shipments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-gray-400">No shipments found.</div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Shipment No.", "Shipment Type", "Final Amt.", "Invoice Link", "Status"].map((col) => (
                <th key={col} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((s) => (
              <tr key={s.id} onClick={() => {
                if (setIntent) {
                  if (s.shipment_type === "forward_shipment") {
                    setIntent("forward")
                  }
                  if (s.shipment_type === "reverse_shipment") {
                    setIntent("reverse");
                  }
                  if (s.shipment_type === "drop_shipment") {
                    setIntent("drop")
                  }
                }
                onSelectShipment(s.id);
                pushIdToUrl(s.id, s.shipment_type)
              }} className="hover:bg-gray-100 transition-colors cursor-pointer">
                <td className="px-4 py-3 font-medium text-gray-800">{s.shipment_number ?? s.id ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">{formatLabel(s.shipment_type)}</td>
                <td className="px-4 py-3 text-gray-700 tabular-nums">{fmt(s.aggregates?.final_amount)}</td>
                <td className="px-4 py-3">
                  {s.invoice_link ? (
                    <a href={s.invoice_link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                      Link <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CreateForwardShipment({ orderId, onBack, onSuccess }) {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState("");
  const [lineItems, setLineItems] = useState([]);
  const [rows, setRows] = useState([{ id: Date.now(), oli_id: "", quantity: "" }]);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setNodes([{ id: 1, name: "Default Node" }]);
      setLoadingNodes(false);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/nodes_for_shipment?order_id=${orderId}`)
      .then((r) => r.json())
      .then((json) => {
        const data = json.data ?? [];
        setNodes(data.length ? data : [{ id: 1, name: "Default Node" }]);
      })
      .catch(() => setNodes([{ id: 1, name: "Default Node" }]))
      .finally(() => setLoadingNodes(false));
  }, [orderId]);

  useEffect(() => {
    if (!orderId) { setLoadingItems(false); return; }
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/shippable_line_items?order_id=${orderId}`)
      .then((r) => r.json())
      .then((json) => { if (json.status !== "failure") setLineItems(json.data ?? []); })
      .catch(console.error)
      .finally(() => setLoadingItems(false));
  }, [orderId]);

  const selectedOliIds = (rowId) =>
    rows.filter((r) => r.id !== rowId && r.oli_id !== "").map((r) => String(r.oli_id));

  const availableItems = (rowId) =>
    lineItems.filter((li) => !selectedOliIds(rowId).includes(String(li.oli_id)));

  const getItem = (oli_id) => lineItems.find((li) => String(li.oli_id) === String(oli_id));

  const updateRow = (id, field, value) =>
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));

  const removeRow = (id) =>
    setRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);

  const addRow = () => {
    const taken = rows.map((r) => String(r.oli_id));
    const remaining = lineItems.filter((li) => !taken.includes(String(li.oli_id)));
    if (remaining.length === 0) { toast.error("All available SKUs have been added."); return; }
    setRows((prev) => [...prev, { id: Date.now(), oli_id: "", quantity: "" }]);
  };

  const handleCreate = async () => {
    if (!selectedNode) { toast.error("Please select a node."); return; }
    const validRows = rows.filter((r) => r.oli_id && Number(r.quantity) > 0);
    if (!validRows.length) { toast.error("Add at least one line item with a valid quantity."); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipment: {
            order_id: orderId ? Number(orderId) : undefined,
            node_id: Number(selectedNode),
            shipment_type: "forward_shipment",
            line_items: validRows.map((r) => ({
              order_line_item_id: Number(r.oli_id),
              quantity: Number(r.quantity),
            })),
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to create shipment");
      toast.success("Shipment created successfully!");
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cols = [
    { label: "SKU Name", cls: "" },   // auto / fills remaining
    { label: "Quantity", cls: "w-36" },   
    { label: "MRP", cls: "w-24" },
    { label: "Selling Price", cls: "w-28" },
    { label: "Discount Amt.", cls: "w-28" },
    { label: "Total Amt.", cls: "w-24" },
    { label: "Final Amt.", cls: "w-24" },
    { label: "Del", cls: "w-10" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary text-primary hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <h2 className="text-sm font-bold text-primary ">Forward Shipment</h2>
        <button
          onClick={handleCreate}
          disabled={submitting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Create
        </button>
      </div>

      <div className="px-5 py-4 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5 max-w-xs">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Select Node</label>
          {loadingNodes ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <SearchableDropdown
              placeholder="Select a node"
              options={nodes}
              value={selectedNode}
              onChange={setSelectedNode}
              searchPlaceholder="Search nodes..."
            />
          )}
        </div>

        {/* Line items */}
        <div>
          <p className="text-sm font-bold text-primary mb-3">Shipment Line Items</p>
          <div className="rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {cols.map((col) => (
                    <th key={col.label} className={`${col.cls} px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => {
                  const item = getItem(row.oli_id);
                  const options = availableItems(row.id);

                  const dropdownOptions = [
                    ...(item && !options.find((o) => o.oli_id === item.oli_id) ? [item] : []),
                    ...options,
                  ];

                  return (
                    <tr key={row.id} className="align-top">

                      {/* SKU Name -> SearchableDropdown */}
                      <td className="px-3 py-2.5">
                        {loadingItems ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        ) : (
                          <SearchableDropdown
                            placeholder="Select SKU"
                            options={dropdownOptions}
                            value={row.oli_id}
                            onChange={(v) => updateRow(row.id, "oli_id", v)}
                            valueKey="oli_id"
                            labelKey="sku_name"
                            searchPlaceholder="Search SKU..."
                            emptyMessage="No SKUs available"
                            renderOption={(opt) => (
                              <div className="flex flex-col gap-0.5 py-0.5">
                                <span className="text-xs font-medium text-gray-800 whitespace-normal leading-snug">{opt.sku_name}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{opt.sku_code}</span>
                              </div>
                            )}
                            renderSelected={(opt) => (
                              <span className="text-xs text-gray-800 whitespace-normal leading-snug">{opt.sku_name}</span>
                            )}
                          />
                        )}

                        {item && (
                          <div className="mt-1.5 flex flex-col gap-0.5 px-0.5">
                            <span className="text-[11px] text-gray-400 font-mono">{item.sku_code}</span>
                            <div className="flex flex-wrap gap-1">
                              {item.line_item_type === "bundle" && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                  <Layers className="w-2 h-2" />Bundle
                                </span>
                              )}
                              {item.line_item_type === "loose" && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  <Sparkles className="w-2 h-2" />Loose
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1">
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) => {
                              const v = parseInt(e.target.value);
                              const currentItem = dropdownOptions.find(option => option.oli_id === row.oli_id);
                              if (v > parseInt(currentItem.remaining_quantity)) {
                                toast.error(`Quantity(${v}) cannot be more than remaining quantity ${currentItem.remaining_quantity}`);
                                // updateRow(row.id, "quantity", parseInt(currentItem.remaining_quantity));
                                return;
                              }
                              updateRow(row.id, "quantity", isNaN(v) || v < 1 ? "" : v);
                            }}
                            placeholder="Qty"
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700"
                            onWheel={(e) => e.target.blur()}
                          />
                          {item && (
                            <div className="flex flex-col text-[11px] text-gray-500 leading-snug px-0.5">
                              <span>Ordered: <b className="text-gray-700">{item.ordered_quantity}</b></span>
                              <span>Remaining: <b className="text-gray-700">{item.remaining_quantity}</b></span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* MRP */}
                      <td className="px-3 py-2.5 text-gray-700 tabular-nums">{fmt(item?.mrp)}</td>

                      {/* Selling Price */}
                      <td className="px-3 py-2.5 text-gray-700 tabular-nums">{fmt(item?.selling_price)}</td>

                      {/* Discount Amt */}
                      <td className="px-3 py-2.5 tabular-nums">
                        {parseFloat(item?.discount_amount) > 0
                          ? <span className="text-red-500">-{fmt(item.discount_amount)}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Total Amt */}
                      <td className="px-3 py-2.5 text-gray-700 tabular-nums">{fmt(item?.total_amount)}</td>

                      {/* Final Amt */}
                      <td className="px-3 py-2.5 font-semibold text-primary tabular-nums">{fmt(item?.final_amount)}</td>

                      {/* Del */}
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => removeRow(row.id)}
                          className="text-gray-300 hover:text-red-700 transition-colors cursor-pointer "
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Add row -> hidden when all SKUs are already in rows */}
                {lineItems.filter((li) => !rows.map((r) => String(r.oli_id)).includes(String(li.oli_id))).length > 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-2.5">
                      <button
                        onClick={addRow}
                        className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add another Item
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateDropShipment({ orderId, onBack, onSuccess }) {

  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [lineItems, setLineItems] = useState([]);
  const [rows, setRows] = useState([{ id: Date.now(), oli_id: "", quantity: "", product_sku_id: "", mrp: "", sku_name: "", sku_code: "" }]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSkus, setSelectedSkus] = useState([]);
  const [canSelectVendor, setCanSelectVendor] = useState(false);

  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const router = useRouter();

  const [vendorName, setVendorName] = useState("");

  useEffect(() => {
    const skus = rows.map(r => r.product_sku_id).filter(Boolean);
    setSelectedSkus(skus);
    setCanSelectVendor(false);
  }, [rows]);

  useEffect(() => {
    if (selectedSkus.length === 0) return;
    fetchVendorsForSelectedSkus(selectedSkus);
  }, [canSelectVendor]);


  useEffect(() => {
    if (!orderId) { setLoadingItems(false); return; }
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/shippable_line_items?order_id=${orderId}`)
      .then((r) => r.json())
      .then((json) => { if (json.status !== "failure") setLineItems(json.data ?? []); })
      .catch(console.error)
      .finally(() => setLoadingItems(false));
  }, [orderId]);

  const fetchVendorsForSelectedSkus = (selectedSkus) => {
    if (selectedSkus.length === 0) return;
    setLoadingVendors(true);
    const productSkuIds = selectedSkus.join(",");
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments/vendors_for_drop_shipment?order_id=${orderId}&product_sku_ids=${productSkuIds}`)
      .then((r) => r.json())
      .then((json) => {
        const data = json.data ?? [];
        setVendors(data ?? []);
      })
      .catch(() => setVendors([]))
      .finally(() => setLoadingVendors(false));
  }

  const selectedOliIds = (rowId) =>
    rows.filter((r) => r.id !== rowId && r.oli_id !== "").map((r) => String(r.oli_id));

  const availableItems = (rowId) =>
    lineItems.filter((li) => !selectedOliIds(rowId).includes(String(li.oli_id)));

  const getItem = (oli_id) => lineItems.find((li) => String(li.oli_id) === String(oli_id));

  const updateRow = (id, field, value) =>
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));

  const removeRow = (id) =>
    setRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);

  const addRow = () => {
    const taken = rows.map((r) => String(r.oli_id));
    const remaining = lineItems.filter((li) => !taken.includes(String(li.oli_id)));
    if (remaining.length === 0) { toast.error("All available SKUs have been added."); return; }
    setRows((prev) => [...prev, { id: Date.now(), oli_id: "", quantity: "", product_sku_id: "", mrp: "", sku_name: "", sku_code: "" }]);
  };

  const handleCreate = async () => {
    if (!selectedVendor) { toast.error("Please select a vendor."); return; }
    const validRows = rows.filter((r) => r.oli_id && Number(r.quantity) > 0);
    if (!validRows.length) { toast.error("Add at least one line item with a valid quantity."); return; }

    console.log(validRows);
    setSubmitting(true);
    const payload = {
      shipment: {
        order_id: orderId ? Number(orderId) : undefined,
        vendor_id: Number(selectedVendor),
        shipment_type: "drop_shipment",
        line_items: validRows.map((r) => ({
          order_line_item_id: Number(r.oli_id),
          quantity: Number(r.quantity),
        })),
      },
    };

    const sessionDataForPo = {
      shipment: {
        order_id: orderId ? Number(orderId) : undefined,
        vendor_id: Number(selectedVendor),
        vendor_name: vendorName,
        shipment_type: "drop_shipment",
        line_items: validRows.map((r) => ({
          order_line_item_id: Number(r.oli_id),
          quantity: Number(r.quantity),
          unit_price: Number(r.mrp),
          sku_name: r.sku_name,
          sku_code: r.sku_code
        })),
        order_id: orderId,
      },
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors?.[0] ?? "Failed to create shipment");
      toast.success("Drop Shipment created successfully!");
      onSuccess();
      sessionDataForPo.shipment.drop_shipment_id = json?.data?.id;
      sessionStorage.setItem("dropShipmentData", JSON.stringify(sessionDataForPo));
      params.set("fromDropShipment", "true");
      router.push(`/purchase_orders/create?${params.toString()}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cols = [
    { label: "SKU Name", cls: "" },   // auto / fills remaining
    { label: "Quantity", cls: "w-36" },   
    { label: "MRP", cls: "w-24" },
    { label: "Selling Price", cls: "w-28" },
    { label: "Discount Amt.", cls: "w-28" },
    { label: "Total Amt.", cls: "w-24" },
    { label: "Final Amt.", cls: "w-24" },
    { label: "Del", cls: "w-10" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary text-primary hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <h2 className="text-sm font-bold text-primary ">Drop Shipment</h2>
        <button
          onClick={handleCreate}
          disabled={submitting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Create
        </button>
      </div>

      <div className="px-5 py-4 flex flex-col gap-5">
        {/* Line items */}
        <div>
          <p className="text-sm font-bold text-primary mb-3">Shipment Line Items</p>
          <div className="rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {cols.map((col) => (
                    <th key={col.label} className={`${col.cls} px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => {
                  const item = getItem(row.oli_id);
                  const options = availableItems(row.id);

                  // Build dropdown options — always include current selection
                  const dropdownOptions = [
                    ...(item && !options.find((o) => o.oli_id === item.oli_id) ? [item] : []),
                    ...options,
                  ];

                  return (
                    <tr key={row.id} className="align-top">

                      {/* SKU Name -> SearchableDropdown */}
                      <td className="px-3 py-2.5">
                        {loadingItems ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        ) : (
                          <SearchableDropdown
                            placeholder="Select SKU"
                            options={dropdownOptions}
                            value={row.oli_id}
                            onChange={(v) => {
                              const item = lineItems.find(li => li.oli_id === v);

                              setRows(prev =>
                                prev.map(r =>
                                  r.id === row.id
                                    ? {
                                      ...r,
                                      oli_id: v,
                                      product_sku_id: item?.product_sku_id ?? "",
                                      mrp: item?.mrp ?? "",
                                      sku_name: item.sku_name,
                                      sku_code: item.sku_code
                                    }
                                    : r
                                )
                              );
                            }}
                            valueKey="oli_id"
                            labelKey="sku_name"
                            searchPlaceholder="Search SKU..."
                            emptyMessage="No SKUs available"
                            renderOption={(opt) => (
                              <div className="flex flex-col gap-0.5 py-0.5">
                                <span className="text-xs font-medium text-gray-800 whitespace-normal leading-snug">{opt.sku_name}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{opt.sku_code}</span>
                              </div>
                            )}
                            renderSelected={(opt) => (
                              <span className="text-xs text-gray-800 whitespace-normal leading-snug">{opt.sku_name}</span>
                            )}
                          />
                        )}
                        {item && (
                          <div className="mt-1.5 flex flex-col gap-0.5 px-0.5">
                            <span className="text-[11px] text-gray-400 font-mono">{item.sku_code}</span>
                            <div className="flex flex-wrap gap-1">
                              {item.line_item_type === "bundle" && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                  <Layers className="w-2 h-2" />Bundle
                                </span>
                              )}
                              {item.line_item_type === "loose" && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  <Sparkles className="w-2 h-2" />Loose
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      {/* Quantity -> fixed width, ordered/remaining shown below input */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1">
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) => {
                              const v = parseInt(e.target.value);
                              const currentItem = dropdownOptions.find(option => option.oli_id === row.oli_id);
                              if (v > parseInt(currentItem.remaining_quantity)) {
                                toast.error(`Quantity(${v}) cannot be more than remaining quantity ${currentItem.remaining_quantity}`);
                                // updateRow(row.id, "quantity", parseInt(currentItem.remaining_quantity));
                                return;
                              }
                              updateRow(row.id, "quantity", isNaN(v) || v < 1 ? "" : v);
                            }}
                            placeholder="Qty"
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700"
                            onWheel={(e) => e.target.blur()}
                          />
                          {item && (
                            <div className="flex flex-col text-[11px] text-gray-500 leading-snug px-0.5">
                              <span>Ordered: <b className="text-gray-700">{item.ordered_quantity}</b></span>
                              <span>Remaining: <b className="text-gray-700">{item.remaining_quantity}</b></span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* MRP */}
                      <td className="px-3 py-2.5 text-gray-700 tabular-nums">{fmt(item?.mrp)}</td>

                      {/* Selling Price */}
                      <td className="px-3 py-2.5 text-gray-700 tabular-nums">{fmt(item?.selling_price)}</td>

                      {/* Discount Amt */}
                      <td className="px-3 py-2.5 tabular-nums">
                        {parseFloat(item?.discount_amount) > 0
                          ? <span className="text-red-500">-{fmt(item.discount_amount)}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Total Amt */}
                      <td className="px-3 py-2.5 text-gray-700 tabular-nums">{fmt(item?.total_amount)}</td>

                      {/* Final Amt */}
                      <td className="px-3 py-2.5 font-semibold text-primary tabular-nums">{fmt(item?.final_amount)}</td>

                      {/* Del */}
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => removeRow(row.id)}
                          className="text-gray-300 hover:text-red-700 transition-colors cursor-pointer "
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Add row -> hidden when all SKUs are already in rows */}
                {lineItems.filter((li) => !rows.map((r) => String(r.oli_id)).includes(String(li.oli_id))).length > 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-2.5">
                      <button
                        onClick={addRow}
                        className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add another Item
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!canSelectVendor && (
          <div className="flex justify-end ">
            <button className="bg-primary text-gray-100 px-3 py-2 rounded-md text-sm hover:opacity-80 cursor-pointer" onClick={(e) => setCanSelectVendor(true)}>
              Select vendor
            </button>
          </div>
        )}

        {canSelectVendor && (
          <div className="flex flex-col justify-end items-end gap-1.5 ">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Select Vendor</label>
            <div className="w-60">
              {loadingVendors ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <SearchableDropdown
                  placeholder="Select a vendor"
                  options={vendors}
                  value={selectedVendor}
                  onChange={(option) => {
                    setVendorName(vendors.find(v => v.id === option)?.firm_name);
                    setSelectedVendor(option);
                  }}
                  valueKey="id"
                  labelKey="firm_name"
                  searchPlaceholder="Search vendors..."
                />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    created: "bg-gray-100 text-gray-700",
    packed: "bg-amber-100 text-amber-700",
    invoiced: "bg-purple-100 text-purple-700",
    dispatched: "bg-sky-100 text-sky-700",
    delivered: "bg-green-100 text-green-700",
    return_initiated: "bg-orange-100 text-orange-700",
    return_completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${map[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600"}`}>
      {status ?? "—"}
    </span>
  );
}

function formatLabel(str) {
  if (!str) return "—";
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}