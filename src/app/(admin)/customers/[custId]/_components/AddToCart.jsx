"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  Trash2,
  Plus,
  ShoppingCart,
  Search,
  ChevronDown,
  Loader2,
  ArrowRight,
  Tag,
  Ticket,
  CheckCircle2,
  X,
} from "lucide-react";
import { useConfirmModal } from "../../../../../../components/shared/ConfirmModal";
import CheckoutForm from "./CheckoutForm";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// ─── SKU Search Dropdown ────────────────────────────────────────────────────
function SkuSearchDropdown({ selectedSku, onSelect, excludedSkuIds = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Fetch on search query change
  // Change the useEffect:
  useEffect(() => {
    if (!isOpen) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSkus(searchQuery, excludedSkuIds), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, isOpen, excludedSkuIds]);

  // Change fetchSkus signature to accept it:
  const fetchSkus = async (search = "", excluded = []) => {
    setLoading(true);
    try {
      const url = new URL(`${BASE_URL}/admin/api/v1/sales/carts/cart_skus`);
      if (search) url.searchParams.set("starts_with", search);
      const res = await fetch(url.toString());
      const json = await res.json();
      const all = json.data || [];
      const filtered = all.filter(
        (s) => !excluded.includes(s.id) || s.id === selectedSku?.id
      );
      const reordered = selectedSku
        ? [...filtered.filter((s) => s.id === selectedSku.id), ...filtered.filter((s) => s.id !== selectedSku.id)]
        : filtered;
      setOptions(reordered.slice(0, 10));
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (sku) => {
    onSelect(sku);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative w-[90%]" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={`w-full min-h-9 px-3 py-1.5 flex items-start justify-between gap-2 text-sm bg-white border rounded-md transition-colors
    ${isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300 hover:border-gray-400"}
    ${selectedSku ? "text-gray-900" : "text-gray-400"}`}
      >
        <span className="text-left break-words whitespace-normal leading-snug">
          {selectedSku ? selectedSku.sku_name : "Select SKU"}
        </span>
        <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]">
          {/* Search */}
          <div className="p-1 border-b border-gray-100">
            <div className="relative">
              {loading
                ? <Loader2 className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-blue-500" />
                : <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              }
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU..."
                className="w-full pl-7 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1">
            {loading ? (
              <p className="px-3 py-3 text-sm text-gray-400 text-center">Searching...</p>
            ) : options.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400 text-center">No SKUs found</p>
            ) : (
              options.map((sku) => {
                const isSelected = selectedSku?.id === sku.id;
                return (
                  <button
                    key={sku.id}
                    type="button"
                    onMouseDown={() => handleSelect(sku)}
                    className={`w-full px-3 py-2 text-left text-xs flex items-start justify-between gap-2 transition-colors
    ${isSelected ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-800"}`}
                  >
                    <span className="font-medium break-words whitespace-normal leading-snug">{sku.sku_name}</span>
                    <span className={`text-xs flex-shrink-0 mt-0.5 ${isSelected ? "text-blue-400" : "text-gray-400"}`}>
                      ₹{parseFloat(sku.mrp).toLocaleString()}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───────────
// const emptyNewItem = () => ({ _id: Date.now() + Math.random(), sku: null, quantity: "" });
const emptyNewItem = () => ({ _id: Date.now() + Math.random(), sku: null, quantity: "" });

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

// ─── Main Component ───────
export default function AddToCart({ customerId = 2, }) {

  const [newItems, setNewItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [clearingCart, setClearingCart] = useState(false);
  const { confirmModal, askConfirm } = useConfirmModal();
  const [canProceedToCheckout, setCanProceedToCheckout] = useState(false);
  const [isRemovingCoupon, setIsRemovingCoupon] = useState(false);
  const [allSkus, setAllSkus] = useState([]);


  const [cartData, setCartData] = useState(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartStatus, setCartStatus] = useState(null);

  const [appliedCoupons, setAppliedCoupons] = useState([]);


  useEffect(() => {
    const fetchSkus = async () => {
      try {
        const res = await fetch(`${BASE_URL}/admin/api/v1/sales/carts/cart_skus`);
        const json = await res.json();
        setAllSkus(json.data || []);
      } catch { setAllSkus([]); }
    };
    fetchSkus();
  }, []);

  // ── Fetch cart ────
  const fetchCart = async () => {
    setLoadingCart(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/carts/cart_summary?customer_id=${customerId}`);
      const json = await res.json();
      if (!res.ok || json.status === "failure") throw new Error(json?.errors[0] ?? "Soemthing went wrong");
      setCartData(json.data || null);
      setCartStatus(json?.data?.status || null);
      setAppliedCoupons(json?.data?.applied_coupons ?? []);
    } catch (err) {
      setCartData(null);
      toast.error("Failed to fetch cart data " + err)
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);


  // ── Derived state ──────────────────────────────────────────────────────────
  const existingLineItems = cartData?.cart_line_items || [];
  const existingSkuIds = existingLineItems.map((li) => li.product_sku?.id).filter(Boolean);
  const newItemSkuIds = newItems.filter((i) => i.sku).map((i) => i.sku.id);
  const allSelectedSkuIds = [...existingSkuIds, ...newItemSkuIds];

  const showSummary =
    !isEditing &&
    existingLineItems.length > 0 &&
    !newItems.some((i) => i.sku || i.quantity);

  // ── Handlers ───────────────────────────────────────────────────────────────
  // const handleExistingQtyChange = (idx, val) => {
  //   setIsEditing(true);
  //   setCartData((prev) => {
  //     const items = [...(prev?.cart_line_items || [])];
  //     items[idx] = { ...items[idx], quantity: val };
  //     return { ...prev, cart_line_items: items };
  //   });
  // };

  const handleExistingQtyChange = (idx, val) => {
    setIsEditing(true);
    setCartData(prev => {
      const items = [...(prev?.cart_line_items || [])];
      items[idx] = { ...items[idx], quantity: val, final_amount: items[idx].selling_price * val };
      return { ...prev, cart_line_items: items };
    });

  }

  const handleDeleteExisting = (idx) => {
    setIsEditing(true);
    setCartData((prev) => {
      const items = [...(prev?.cart_line_items || [])];
      items.splice(idx, 1);
      return { ...prev, cart_line_items: items };
    });
  };

  const handleNewItemSkuSelect = (lineId, sku) => {
    setIsEditing(true);
    setNewItems((prev) =>
      prev.map((item) => (item._id === lineId ? { ...item, sku, quantity: "" } : item))
    );
  };

  const handleNewItemQtyChange = (lineId, val) => {
    setNewItems((prev) =>
      prev.map((item) => (item._id === lineId ? { ...item, quantity: val } : item))
    );
  };

  const handleDeleteNewItem = (lineId) => {
    setNewItems((prev) => prev.filter((item) => item._id !== lineId));
  };

  const handleAddAnotherItem = () => {
    setIsEditing(true);
    setNewItems(prev => ([...prev, emptyNewItem()]));
  };

  const handleClearCart = async () => {
    const confirmed = await askConfirm({
      title: "Clear Cart ??",
      message: "Are you sure you want to Clear the cart ?",
      confirmLabel: "Clear",
      cancelLabel: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;
    try {
      setClearingCart(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/carts/${cartData.id}/clear_cart`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json();
      if (!response.ok || result.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      setCartData(null);
      setNewItems([]);
      setIsEditing(false);
      setCoupon("");
      await fetchCart();//for refresh
      toast.success("Cart cleared successfully");
    } catch (err) {
      console.log(err);
      toast.error("Failed to clear cart " + err.message);
    } finally {
      setClearingCart(false);
    }
  };

  const getNewItemFinalAmount = (item) => {
    if (!item.sku || !item.quantity || isNaN(item.quantity) || Number(item.quantity) <= 0)
      return null;
    return parseFloat(item.sku.selling_price) * Number(item.quantity);
  };

  const handleAddToCart = async () => {
    const filledNewItems = newItems.filter((i) => i.sku || i.quantity);

    for (const item of filledNewItems) {
      if (!item.sku) {
        toast.error("Please select a SKU for all new line items.");
        return;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        toast.error("Please enter a valid quantity (> 0) for all new line items.");
        return;
      }
    }

    const cartLineItems = [
      ...existingLineItems.map((li) => ({
        product_sku_id: li.product_sku_id,
        quantity: Number(li.quantity),
      })),
      ...filledNewItems.map((item) => ({
        product_sku_id: item.sku.id,
        quantity: Number(item.quantity),
      })),
    ];

    if (cartLineItems.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }

    if (newItems.some((item) => !item.sku && !item.quantity)) {
      toast.error("Please fill all fields all rows");
      return;
    }
    const method = existingLineItems.length !== 0 ? "PUT" : "POST";
    const updateCartLineItems = [...filledNewItems.map((item) => ({ product_sku_id: item.sku.id, quantity: Number(item.quantity) })), ...existingLineItems.map((item, index) => ({ id: existingLineItems[index].id, product_sku_id: item.product_sku.id, quantity: Number(item.quantity) }))];
    const payload = method === "POST" ?
      {
        cart: {
          customer_id: customerId,
          source_type: "admin",
          cart_line_items: cartLineItems,
        },
      } :
      {
        cart: {
          customer_id: customerId,
          source_type: "admin",
          cart_line_items: updateCartLineItems
        }
      }
    setSaving(true);
    try {
      const url = method === "POST" ? `${BASE_URL}/admin/api/v1/sales/carts` : `${BASE_URL}/admin/api/v1/sales/carts/${cartData.id}`;
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.status === "failure" || json?.errors[0]) throw new Error(json?.errors[0] ?? "Failed to save cart");
      toast.success("Cart updated successfully!");
      setNewItems([]);
      setIsEditing(false);
      await fetchCart();
    } catch (err) {
      toast.error("Failed to save cat " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyCoupon = async () => {
    try {
      setCouponApplying(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/carts/${cartData.id}/apply_coupon`;
      const response = await fetch(url,
        {
          method: "POST", headers: { "Content-Type": "application/json", },
          body: JSON.stringify({ code: coupon.toString().trim() })
        }
      );
      const result = await response.json();
      if (!response.ok || result.status === "failure") throw new Error(result?.errors?.[0] ?? "Something went wrong");
      toast.success("Coupon applied successfully");
      setCouponApplied(true);
      await fetchCart(); //refresh
    } catch (err) {
      console.log(err);
      toast.error("Failed to apply coupon " + err);
    } finally {
      setCouponApplying(false);
    }
  }

  const handleRemoveCoupon = async () => {
    try {
      setIsRemovingCoupon(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/sales/carts/${cartData.id}/remove_coupon`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: appliedCoupons[0]?.code }) });
      const result = await response.json();
      if (!response.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      await fetchCart(); //refresh
      setCoupon("");
      toast.success("Coupon removed successfully");
    } catch (err) {
      console.log(err);
      toast.error("Failed to remove coupon " + err.message);
    } finally {
      setIsRemovingCoupon(false);
    }
  }

  const hasRows = existingLineItems.length > 0 || newItems.length > 0;

  // ── Column headers ─────────────────────────────────────────────────────────
  const columns = [
    "SKU NAME",
    "SKU CODE",
    "QUANTITY",
    "MRP",
    "UNIT PRICE",
    "SELLING UNIT PRICE",
    "SELLING PRICE",
    "DISCOUNT AMOUNT",
    "FINAL AMOUNT",
    ...(cartStatus === "active" ? ["DEL"] : []),
  ];

  const skuOptions = allSkus
    .filter(s => !allSelectedSkuIds.includes(s.id))
    .map(s => ({
      id: s.id,
      name: `${s.sku_name} (${s.sku_code})`
    }));

  if (canProceedToCheckout) return <CheckoutForm
    cartData={cartData}
    customerId={customerId}
    onBack={() => {setCanProceedToCheckout(false); fetchCart()}}
    fetchCart={fetchCart}
  />

  // ── Render ───────────────
  return (
    <>
      {confirmModal}
      <div className="w-full mx-auto py-4">
        {/* Page Title */}
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-blue-900 tracking-tight">Add to Cart</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm" style={{ overflow: "visible" }}>

          {/* ── Card Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-blue-900">Cart Line Items</h2>
              {cartStatus && (<span className={`px-2 py-1 rounded-full text-xs uppercase ${cartStatus === "active" ? "bg-yellow-500 text-gray-100" : "bg-green-600 text-gray-100"}`}>{cartStatus}</span>)}
            </div>
            {cartStatus !== "checkout" && (
              <button
                onClick={handleClearCart}
                className="text-sm text-gray-600 border border-gray-200 rounded-lg px-4 py-1.5 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all font-medium"
              >
                {clearingCart ? "Clearing cart..." : "Clear Cart"}
              </button>
            )}

          </div>

          {/* ── Table ───────────────────────────────────────────────────────── */}
          <div className="overflow-x-auto" style={{ overflow: "visible" }}>
            <table className="w-full" style={{ overflow: "visible" }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide "
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50" style={{ overflow: "visible" }}>
                {loadingCart ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                      <p className="text-sm text-gray-400 mt-2">Loading cart...</p>
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* ── Existing items from backend ───────────────────────── */}
                    {existingLineItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50/60 transition-colors" style={{ overflow: "visible" }}>
                        {/* SKU NAME */}
                        <td className="px-3 py-3 text-sm font-medium text-gray-800 w-[220px] min-w-[220px] max-w-[220px] ">
                          {item.sku_name || item.product_sku?.sku_name || "—"}
                        </td>
                        {/* SKU CODE */}
                        <td className="py-3 w-[50px]" title={item?.product_sku?.sku_code ?? ""}>
                          <span className="text-xs text-gray-500 truncate cursor-help font-mono bg-gray-50 px-2 py-0.5 rounded">
                            {item.sku_code || item.product_sku?.sku_code || "—"}
                          </span>
                        </td>
                        {/* QUANTITY */}
                        <td className="px-3 py-3 w-[50px]">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            disabled={cartStatus === "checkout"}
                            onChange={(e) => handleExistingQtyChange(idx, e.target.value)}
                            className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                            onWheel={(e) => e.target.blur()}
                          />
                        </td>
                        {/* MRP */}
                        <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                          {fmt(item.mrp)}
                        </td>
                        {/* UNit price */}
                        <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                          {fmt(item.unit_price)}
                        </td>
                        {/* SELLING UNit price */}
                        <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                          {fmt(item.selling_unit_price)}
                        </td>
                        {/* SELLING PRICE */}
                        <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                          {fmt(item.selling_price)}
                        </td>
                        {/* DISCOUNT AMOUNT */}
                        <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                          {fmt(item.discount_amount)}
                        </td>
                        {/* FINAL AMOUNT */}
                        <td className="px-3 py-3 text-sm font-semibold text-gray-800 w-[110px]">
                          {item.final_amount != null && !isNaN(item.final_amount)
                            ? fmt(item.final_amount)
                            : "—"}
                        </td>
                        {/* DELETE */}
                        {(cartStatus === "active" || cartStatus === null) && (
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleDeleteExisting(idx)}
                              className="p-1.5 text-gray-400 cursor-pointer hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}

                      </tr>
                    ))}

                    {/* ── New items being composed ──────────────────────────── */}
                    {newItems.map((item) => (
                      <tr key={item._id} className="bg-blue-50/20" style={{ overflow: "visible" }}>
                        {/* SKU NAME — dropdown */}
                        <td className="px-3 py-3 w-[250px]">
                          <SkuSearchDropdown
                            selectedSku={item.sku}
                            onSelect={(sku) => handleNewItemSkuSelect(item._id, sku)}
                            excludedSkuIds={allSelectedSkuIds.filter((id) => id !== item.sku?.id)}
                          />
                        </td>
                        {/* SKU CODE */}
                        <td className="py-3 w-[70px]" title={item?.product_sku?.sku_code ?? ""}>
                          {item.sku ? (
                            <span className="text-xs truncate text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded">
                              {item.sku.sku_code}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        {/* QUANTITY */}
                        <td className="px-3 py-3 w-[50px]">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            disabled={!item.sku || cartStatus === "checkout"}
                            onChange={(e) => handleNewItemQtyChange(item._id, e.target.value)}
                            placeholder="Qty"
                            className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                            onWheel={(e) => e.target.blur()}
                          />
                        </td>
                        {/* MRP */}
                        <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                          {item.sku ? `₹${parseFloat(item.sku.mrp).toLocaleString()}` : <span className="text-gray-300">—</span>}
                        </td>
                        {/* Unit price */}
                        <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                          {item.sku ? `₹${parseFloat(item.sku.unit_price).toLocaleString()}` : <span className="text-gray-300">—</span>}
                        </td>
                        {/*Selling Unit price */}
                        <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                          {item.sku ? `₹${parseFloat(item.sku.selling_unit_price).toLocaleString()}` : <span className="text-gray-300">—</span>}
                        </td>
                        {/* SELLING PRICE */}
                        <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                          {item.sku ? `₹${parseFloat(item.sku.selling_price).toLocaleString()}` : <span className="text-gray-300">—</span>}
                        </td>
                        {/* DISCOUNT AMOUNT */}
                        <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">
                          {item.sku ? `${(item.sku.discount_amount ? "₹" + item.sku.discount_amount : "-").toLocaleString()}` : <span className="text-gray-300">—</span>}
                        </td>
                        {/* FINAL AMOUNT */}
                        <td className="px-3 py-3 text-sm font-semibold text-gray-800 w-[110px]">
                          {getNewItemFinalAmount(item) != null
                            ? `₹${getNewItemFinalAmount(item).toLocaleString()}`
                            : <span className="text-gray-300 font-normal">—</span>}
                        </td>
                        {/* DELETE */}
                        {(cartStatus === "active" || cartStatus === null) && (
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleDeleteNewItem(item._id)}
                              className="p-1.5 text-gray-400 cursor-pointer hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}

                    {/* ── Empty state ───────────────────────────────────────── */}
                    {!hasRows && !loadingCart && (
                      <tr>
                        <td colSpan={8} className="py-14 text-center">
                          <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm text-gray-400">No items in cart. Add one below.</p>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Add another Item ─────────────────────────────────────────────── */}
          {(cartStatus === "active" || cartStatus === null) && (
            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={handleAddAnotherItem}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 cursor-pointer font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another Item
              </button>
            </div>
          )}


          {/* ── Coupon + Actions row ─────────────────────────────────────────── */}
          {(cartStatus === "active" || cartStatus === null) && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end flex-wrap gap-2">
              {/* Coupon input */}
              {showSummary && appliedCoupons.length === 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Enter coupon code"
                      maxLength={30}
                      className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all w-52"
                    />
                  </div>
                  <button
                    disabled={coupon.length < 4}
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-primary hover:opacity-80 text-white disabled:bg-blue-300"
                  >
                    {couponApplying ? "Applying coupon..." : "Apply Coupon"}
                  </button>
                </div>
              )}

              {appliedCoupons.length > 0 && showSummary && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      <h2 className="text-sm font-semibold text-gray-700">Applied Coupon</h2>
                      <span className="text-xs font-mono font-bold text-primary bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                        {appliedCoupons[0].code}
                      </span>
                    </div>
                    <button
                      title="Remove coupon"
                      onClick={handleRemoveCoupon}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      {isRemovingCoupon ? <Loader2 size={16} /> : <X size={16} />}
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 py-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Coupon Type</p>
                      <p className="text-sm font-medium text-gray-700 capitalize">{appliedCoupons[0].coupon_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Status</p>
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full capitalize
          ${appliedCoupons[0].status?.toLowerCase() === "applied"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {appliedCoupons[0].status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Discount {appliedCoupons[0]?.discount_type === "percentage" ? "%" : "value"}</p>
                      <p className="text-sm font-medium text-gray-700">{appliedCoupons[0].discount_value} {appliedCoupons[0]?.discount_type === "percentage" ? "%" : ""}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Discount Amount</p>
                      <p className="text-sm font-medium text-gray-700">{fmt(appliedCoupons[0].discount_amount)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Items to Cart button */}
              {!showSummary && (
                <button
                  onClick={handleAddToCart}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary hover:opacity-80 active:bg-blue-950 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-6 hover:scale-103 cursor-pointer rounded-md transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Add Items to Cart"}
                </button>
              )}
            </div>
          )}

          {/* ── Order Summary (only when not editing) ───────────────────────── */}
          {showSummary && (
            <div className="px-6 pb-6 flex justify-end">
              <div className="w-72">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-medium text-gray-800">{fmt(cartData?.aggregates?.item_total)}</span>
                  </div>
                  {/* <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Taxable Amount</span>
                    <span className="font-medium text-gray-800">{fmt(cartData?.aggregates?.taxable_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax Amount</span>
                    <span className="font-medium text-gray-800">{fmt(cartData?.aggregates?.tax_amount)}</span>
                  </div> */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount Amount</span>
                    <span className="font-medium text-gray-800">{fmt(cartData?.aggregates?.discount_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm pb-2.5 border-b border-gray-200">
                    <span className="text-gray-500">Total Savings</span>
                    <span className="font-medium text-red-500">
                      - {fmt(cartData?.aggregates?.total_savings)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-semibold text-gray-700">Final Amount</span>
                    <span className="text-base font-bold text-green-600">{fmt(cartData?.aggregates?.final_amount)}</span>
                  </div>
                </div>

                <button onClick={() => setCanProceedToCheckout(true)} className="mt-4 w-full flex items-center justify-center gap-2 bg-primary hover:opacity-80 cursor-pointer active:bg-blue-950 text-white text-sm font-semibold py-3 px-6 rounded-xl transition-colors">
                  Go to Checkout Page
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}