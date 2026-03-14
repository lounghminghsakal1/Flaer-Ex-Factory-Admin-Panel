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
  Package,
  Sparkles,
  X,
} from "lucide-react";
import { useConfirmModal } from "../../../../../../components/shared/ConfirmModal";
import CheckoutForm from "./CheckoutForm";
import { LooseQtyPopup } from "./LooseQtyPopup";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

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

  useEffect(() => {
    if (!isOpen) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSkus(searchQuery, excludedSkuIds), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, isOpen, excludedSkuIds]);

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
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={`w-full min-h-9 px-3 py-1.5 flex items-start justify-between gap-2 text-xs bg-white border rounded-md transition-colors
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
                    className={`w-full px-3 py-2 text-left text-xs flex flex-col items-start justify-between transition-colors
    ${isSelected ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-800"}`}
                  >
                    <span className="font-medium break-words whitespace-normal leading-snug">{sku.sku_name}</span>
                    <span className={`text-[9px] flex-shrink-0 ${isSelected ? "text-blue-400" : "text-gray-400"}`}>
                      {sku.sku_code}
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

const emptyNewItem = () => ({ _id: Date.now() + Math.random(), sku: null, quantity: "" });

const fmt = (val) =>
  val != null && !isNaN(val) ? `₹${parseFloat(val).toLocaleString()}` : "—";

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
  const [isLooseSkuPopupOpen, setIsLooseSkuPopupOpen] = useState(false);
  const [loosePopupTarget, setLoosePopupTarget] = useState(null);

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

  const existingLineItems = cartData?.cart_line_items || [];
  const existingSkuIds = existingLineItems.map((li) => li.product_sku?.id).filter(Boolean);
  const newItemSkuIds = newItems.filter((i) => i.sku).map((i) => i.sku.id);
  const allSelectedSkuIds = [...existingSkuIds, ...newItemSkuIds];

  const showSummary =
    !isEditing &&
    existingLineItems.length > 0 &&
    !newItems.some((i) => i.sku || i.quantity);

  // const handleExistingQtyChange = (idx, val) => {
  //   setIsEditing(true);
  //   setCartData((prev) => {
  //     const items = [...(prev?.cart_line_items || [])];
  //     items[idx] = { ...items[idx], quantity: val };
  //     return { ...prev, cart_line_items: items };
  //   });
  // };

  const handleLooseConfirm = (newBundleQty, newLooseQty) => {
    if (loosePopupTarget?.mode === "existing") {
      const idx = loosePopupTarget.idx;
      setCartData((prev) => {
        const items = [...(prev?.cart_line_items || [])];
        const item = items[idx];
        const looseSellingUnitPrice = parseFloat(
          item.loose_item?.selling_unit_price ?? item.loose_item?.selling_price ?? 0
        );
        const newLooseFinalAmount = newLooseQty * looseSellingUnitPrice;
        items[idx] = {
          ...item,
          quantity: newBundleQty,
          loose_item: item.loose_item
            ? { ...item.loose_item, quantity: newLooseQty, final_amount: newLooseQty > 0 ? newLooseFinalAmount : 0 }
            : newLooseQty > 0
              ? { quantity: newLooseQty, product_sku: null, final_amount: newLooseFinalAmount }
              : null,
        };
        return { ...prev, cart_line_items: items };
      });
      setIsEditing(true);

    } else if (loosePopupTarget?.mode === "standalone-loose") {
      // User edited a standalone loose row via popup.
      // newBundleQty: if user set bundle qty in popup (they may have),
      //               this will be used as it is by the payload builder.
      // newLooseQty:  the loose portion (shown in the loose input in popup).
      // store both back on the line item so the payload builder can use them.
      const idx = loosePopupTarget.idx;
      setCartData((prev) => {
        const items = [...(prev?.cart_line_items || [])];
        const item = items[idx];
        items[idx] = {
          ...item,
          // quantity on a standalone loose line item = total loose qty the user set
          // store _bundleQty as a helper for the payload builder
          quantity: newLooseQty,
          _bundleQty: newBundleQty, 
        };
        return { ...prev, cart_line_items: items };
      });
      setIsEditing(true);

    } else {
      // new item
      setNewItems((prev) =>
        prev.map((it) =>
          it._id === loosePopupTarget?.item?._id
            ? { ...it, quantity: newBundleQty, _looseQty: newLooseQty }
            : it
        )
      );
    }
  };

  const handleExistingQtyChange = (idx, val) => {
    setIsEditing(true);
    setCartData((prev) => {
      const items = [...(prev?.cart_line_items || [])];
      const item = items[idx];

      const bundleFactor = Number(item.product_sku?.bundle_factor ?? 1);
      const bundleSellingUnit = parseFloat(item.selling_unit_price ?? 0);
      const looseQty = Number(item.loose_item?.quantity) || 0;
      const looseSellingUnit = parseFloat(
        item.loose_item?.selling_unit_price ?? item.loose_item?.selling_price ?? 0
      );

      const bundleFinal = val * bundleFactor * bundleSellingUnit;
      const looseFinal = looseQty * looseSellingUnit;
      const combinedFinal = bundleFinal + looseFinal;

      items[idx] = {
        ...item,
        quantity: val,
        final_amount: item.line_item_type === "bundle" ? parseFloat(item.selling_price ?? 0) * val : parseFloat(item.selling_price ?? 0) * val, // combinedFinal
      };
      return { ...prev, cart_line_items: items };
    });
  };

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
    if (!item.sku) return null;

    if (item.sku.is_bundle_sku) {
      const bundleQty = Number(item.quantity) || 0;
      const looseQty = Number(item._looseQty) || 0;
      if (bundleQty === 0 && looseQty === 0) return null;

      const bundleFinal = bundleQty * Number(item.sku.bundle_factor) * parseFloat(item.sku.selling_unit_price ?? 0);
      const looseFinal = looseQty * parseFloat(item.sku.loose_sku?.selling_unit_price ?? 0);
      return parseFloat(item.sku.selling_price) * Number(item.quantity);
    }

    if (!item.quantity || Number(item.quantity) <= 0) return null;
    return parseFloat(item.sku.selling_price) * Number(item.quantity);
  };

  const handleAddToCart = async () => {
    const filledNewItems = newItems.filter((i) => {
      if (!i.sku) return false;

      if (i.sku.is_bundle_sku) {
        const bundleQty = Number(i.quantity) || 0;
        const looseQty = Number(i._looseQty) || 0;
        return bundleQty > 0 || looseQty > 0;
      }

      return Number(i.quantity) > 0;
    });

    // Validation for new items
    for (const item of filledNewItems) {
      if (!item.sku) {
        toast.error("Please select a SKU for all new line items.");
        return;
      }
      if (item.sku.is_bundle_sku) {
        const totalQty =
          (Number(item.quantity) || 0) * Number(item.sku.bundle_factor) +
          (Number(item._looseQty) || 0);
        if (totalQty <= 0) {
          toast.error(`Please enter a bundle qty or loose qty for "${item.sku.sku_name}".`);
          return;
        }
      } else {
        if (!item.quantity || Number(item.quantity) <= 0) {
          toast.error("Please enter a valid quantity (> 0) for all new line items.");
          return;
        }
      }
    }

    if (newItems.some((item) => !item.sku && !item.quantity)) {
      toast.error("Please fill all fields for all rows");
      return;
    }

    //  Validation for existing bundle items — catch 0 bundle + 0 loose 
    const isNestedLoose = (li) =>
      li.line_item_type === "loose" &&
      li.meta?.bundle_line_item_id !== null &&
      li.meta?.bundle_line_item_id !== undefined;

    for (const item of existingLineItems.filter((li) => !isNestedLoose(li))) {
      if (item.line_item_type === "bundle") {
        const bundleCount = Number(item.quantity) || 0;
        const looseItemQty = Number(item.loose_item?.quantity) || 0;
        const totalQty = bundleCount * Number(item.product_sku?.bundle_factor ?? 1) + looseItemQty;
        if (totalQty === 0) {
          const name = item.product_sku?.sku_name || `Item #${item.id}`;
          toast.error(`Total quantity can't be zero for "${name}". Please enter a bundle or loose qty, or remove the item.`);
          return;
        }

      } else if (item.line_item_type === "loose" && item.bundle_sku != null) {
        // standalone-loose row -> bundle qty lives in _bundleQty, loose qty in item.quantity
        const looseQty = Number(item.quantity) || 0;
        const bundleQty = Number(item._bundleQty) || 0;
        const totalQty = bundleQty * Number(item.bundle_sku?.bundle_factor ?? 1) + looseQty;
        if (totalQty === 0) {
          const name = item.bundle_sku?.sku_name || item.product_sku?.sku_name || `Item #${item.id}`;
          toast.error(`Total quantity can't be zero for "${name}". Please enter a bundle or loose qty, or remove the item.`);
          return;
        }

      } else {
        if (!item.quantity || Number(item.quantity) <= 0) {
          const name = item.product_sku?.sku_name || `Item #${item.id}`;
          toast.error(`Quantity can't be zero for "${name}".`);
          return;
        }
      }
    }

    //  Payload builders 
    const buildNewItem = (item) => {
      if (!item.sku.is_bundle_sku) {
        return { product_sku_id: item.sku.id, quantity: Number(item.quantity) };
      }

      const bundleQty = Number(item.quantity) || 0;
      const looseQty = Number(item._looseQty) || 0;

      if (bundleQty > 0) {
        return {
          product_sku_id: item.sku.id,
          quantity: bundleQty * Number(item.sku.bundle_factor) + looseQty,
        };
      }

      // loose-only new item -> loose_sku sits directly on the sku object
      const looseSkuId = item.sku.loose_sku?.id;
      if (!looseSkuId) {
        toast.error(
          `No loose SKU found for "${item.sku.sku_name}". Cannot add loose-only.`
        );
        return null;
      }

      return { product_sku_id: looseSkuId, quantity: looseQty };
    };

    const buildExistingItem = (item) => {
      if (item.line_item_type === "bundle") {
        const bundleCount = Number(item.quantity) || 0;
        const looseItemQty = Number(item.loose_item?.quantity) || 0;
        const bf = Number(item.product_sku?.bundle_factor ?? 1);

        if (bundleCount > 0) {
          return {
            id: item.id,  
            product_sku_id: item.product_sku.id,
            quantity: bundleCount * bf + looseItemQty,
          };
        }

        // bundle zeroed out so — loose only
        const looseSkuId =
          item.loose_sku?.id ??
          item.loose_item?.product_sku?.id ??
          item.loose_item?.product_sku_id;

        if (!looseSkuId) {
          toast.error(`No loose SKU found for "${item.product_sku?.sku_name ?? "this item"}". Cannot save loose-only quantity.`);
          return null;
        }

        return {
          id: item.loose_item?.id ?? undefined,
          product_sku_id: looseSkuId,
          quantity: looseItemQty,
        };
      }

      if (item.line_item_type === "loose") {
        const looseQty = Number(item.quantity) || 0;
        const bundleQty = Number(item._bundleQty) || 0;
        const bf = Number(item.bundle_sku?.bundle_factor ?? item.product_sku?.bundle_factor ?? 1);

        if (bundleQty > 0) {
          const bundleSkuId = item.bundle_sku?.id ?? item.product_sku?.id;
          return {
            // Don't send id here — because creating a NEW bundle line item
            // The existing id belongs to the loose line item, not a bundle
            product_sku_id: bundleSkuId,
            quantity: bundleQty * bf + looseQty,
          };
        }

        // pure loose — updating the existing loose line item
        return {
          id: item.id, 
          product_sku_id: item.product_sku?.id,
          quantity: looseQty,
        };
      }

      // plain SKU
      return {
        id: item.id,
        product_sku_id: item.product_sku?.id,
        quantity: Number(item.quantity),
      };
    };

    const existingPayloadItems = existingLineItems
      .filter((li) => !isNestedLoose(li))
      .map(buildExistingItem)
      .filter(Boolean);

    const newPayloadItems = filledNewItems.map(buildNewItem).filter(Boolean);

    if (
      existingPayloadItems.length !== existingLineItems.filter((li) => !isNestedLoose(li)).length ||
      newPayloadItems.length !== filledNewItems.length
    ) {
      setSaving(false);
      return; 
    }

    const cartLineItems = [...existingPayloadItems, ...newPayloadItems];
    const updateCartLineItems = [...newPayloadItems, ...existingPayloadItems];

    if (cartLineItems.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }
    const method = existingLineItems.length > 0 ? "PUT" : "POST";

    const payload =
      method === "POST"
        ? { cart: { customer_id: customerId, source_type: "admin", cart_line_items: cartLineItems } }
        : { cart: { customer_id: customerId, source_type: "admin", cart_line_items: updateCartLineItems } };

    setSaving(true);
    try {
      const url =
        method === "POST"
          ? `${BASE_URL}/admin/api/v1/sales/carts`
          : `${BASE_URL}/admin/api/v1/sales/carts/${cartData.id}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.status === "failure" || json?.errors?.[0])
        throw new Error(json?.errors?.[0] ?? "Failed to save cart");
      toast.success("Cart updated successfully!");
      setNewItems([]);
      setIsEditing(false);
      await fetchCart();
    } catch (err) {
      toast.error("Failed to save cart: " + err.message);
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
      setCoupon("");
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
    ...((cartStatus === "active" || cartStatus === null) ? ["DEL"] : []),
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
    onBack={() => { setCanProceedToCheckout(false); fetchCart() }}
    fetchCart={fetchCart}
  />

  return (
    <>
      {confirmModal}
      <div className="w-full mx-auto py-4">
        {/* Page Title */}
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-blue-900 tracking-tight">Add to Cart</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm" style={{ overflow: "visible" }}>

          {/*  Card Header  */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-blue-900">Cart Line Items</h2>
              {cartStatus && (<span className={`px-2 py-1 rounded-full text-xs uppercase ${cartStatus === "active" ? "bg-yellow-500 text-gray-100" : "bg-green-600 text-gray-100"}`}>{cartStatus}</span>)}
            </div>
            {cartStatus !== "checkout" && cartData?.id && (
              <button
                onClick={handleClearCart}
                className="text-sm text-gray-600 border border-gray-200 rounded-lg px-4 py-1.5 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all font-medium"
              >
                {clearingCart ? "Clearing cart..." : "Clear Cart"}
              </button>
            )}
          </div>

          {/*  Table  */}
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
                    {/*  Existing items from backend  */}

                    {existingLineItems
                      .filter((item) => !(item.line_item_type === "loose" && item?.meta?.bundle_line_item_id !== null)) // loose rows are nested in bundle rows
                      .map((item, idx) => {
                        const isBundle = item.line_item_type === "bundle";
                        const isStandaloneLosseWithBundleSku =
                          item.line_item_type === "loose" &&
                          (item.meta?.bundle_line_item_id == null) &&
                          item.bundle_sku != null;
                        const bundleFactor = item.product_sku?.bundle_factor ?? 1;
                        const looseQty = item.loose_item?.quantity ?? 0;
                        // Show total units in the input (bundle count * factor)
                        const displayQty = isBundle ? item.quantity * bundleFactor : item.quantity;

                        return (
                          <tr key={item.id || idx} className="hover:bg-gray-50/60 transition-colors" style={{ overflow: "visible" }}>
                            {/* SKU NAME */}
                            <td className="px-2 py-3 text-xs font-medium text-gray-800 w-[220px] min-w-[220px] max-w-[220px]">
                              <div className="flex flex-col gap-1">
                                <span>{item.line_item_type === "loose" ? item?.bundle_sku?.sku_name : item.sku_name || item.product_sku?.sku_name || "—"}</span>
                                {(item.line_item_type === "bundle" || item.line_item_type === "loose") && (
                                  <span className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                    <Package className="w-2.5 h-2.5" />
                                    Bundle ×{item.product_sku?.bundle_factor}
                                  </span>
                                )}
                                {/* {item.line_item_type === "loose" && (
                                  <span className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Loose
                                  </span>
                                )} */}
                              </div>
                            </td>


                            {/* SKU CODE */}
                            <td className="py-3 w-[50px]" title={item?.product_sku?.sku_code ?? ""}>
                              <span className="text-xs text-gray-500 truncate cursor-help font-mono bg-gray-50 px-2 py-0.5 rounded">
                                {item.line_item_type === "loose" ? item?.bundle_sku?.sku_code : item.sku_code || item.product_sku?.sku_code || "—"}
                              </span>
                            </td>
                            {/* QUANTITY */}
                            <td className="px-3 py-3 w-[140px]">
                              {(isBundle || isStandaloneLosseWithBundleSku) ? (
                                <div className="flex flex-col gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    // For standalone loose rows: _bundleQty holds the bundle count
                                    value={isBundle ? item.quantity : (item._bundleQty ?? 0)}
                                    disabled={cartStatus === "checkout"}
                                    onChange={(e) => {
                                      if (isBundle) {
                                        handleExistingQtyChange(idx, Number(e.target.value) || 0);
                                      } else {
                                        // update _bundleQty for standalone loose row
                                        setIsEditing(true);
                                        setCartData((prev) => {
                                          const items = [...(prev?.cart_line_items || [])];
                                          items[idx] = { ...items[idx], _bundleQty: Number(e.target.value) || 0 };
                                          return { ...prev, cart_line_items: items };
                                        });
                                      }
                                    }}
                                    className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-primary transition-all"
                                    onWheel={(e) => e.target.blur()}
                                  />
                                  {/* loose info line */}
                                  {(() => {
                                    const displayBundleQty = isBundle ? item.quantity : (item._bundleQty ?? 0);
                                    const displayLooseQty = isBundle
                                      ? (item.loose_item?.quantity ?? 0)
                                      : Number(item.quantity); // for standalone loose, quantity IS the loose qty
                                    const total = displayBundleQty * bundleFactor + displayLooseQty;
                                    return displayLooseQty > 0 ? (
                                      <span className="text-[10px] text-slate-500">
                                        +{displayLooseQty} loose&nbsp;|&nbsp;
                                        <span className="text-primary font-medium">Total: {total}</span>
                                      </span>
                                    ) : null;
                                  })()}
                                  {cartStatus !== "checkout" && (
                                    <span
                                      className="text-[11px] cursor-pointer text-primary hover:underline w-fit"
                                      onClick={() => {
                                        setLoosePopupTarget({
                                          mode: isBundle ? "existing" : "standalone-loose",
                                          item,
                                          idx,
                                        });
                                        setIsLooseSkuPopupOpen(true);
                                      }}
                                    >
                                      {(() => {
                                        const looseCount = isBundle
                                          ? (item.loose_item?.quantity ?? 0)
                                          : Number(item.quantity);
                                        return looseCount > 0 ? "✏ Edit loose sku" : "+ Add loose sku";
                                      })()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                // plain SKU 
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  disabled={cartStatus === "checkout"}
                                  onChange={(e) => handleExistingQtyChange(idx, Number(e.target.value) || 0)}
                                  className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-primary transition-all"
                                  onWheel={(e) => e.target.blur()}
                                />
                              )}
                            </td>

                            {/* MRP */}
                            <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">{item.line_item_type === "loose" ? fmt(item.bundle_sku.mrp) : fmt(item.mrp)}</td>
                            {/* UNIT PRICE */}
                            <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">{item.line_item_type === "loose" ? fmt(item.bundle_sku.unit_price) : fmt(item.unit_price)}</td>
                            {/* SELLING UNIT PRICE */}
                            <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">{item.line_item_type === "loose" ? fmt(item.bundle_sku.selling_unit_price) : fmt(item.selling_unit_price)}</td>
                            {/* SELLING PRICE */}
                            <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">{item.line_item_type === "loose" ? fmt(item.bundle_sku.selling_price) : fmt(item.selling_price)}</td>
                            {/* DISCOUNT AMOUNT */}
                            <td className="px-3 py-3 text-sm text-gray-700 w-[90px]">{item.line_item_type === "loose" ? fmt(item.bundle_sku.discount_amount) : fmt(item.discount_amount)}</td>
                            {/* FINAL AMOUNT */}
                            <td className="px-3 py-3 text-sm font-semibold text-gray-800 w-[110px]">
                              {item.line_item_type === "loose" ? Number(item.bundle_sku.selling_price * (item._bundleQty ?? 0)).toFixed(2) : item.final_amount != null && !isNaN(item.final_amount) ? fmt(item.final_amount) : "—"}
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
                        );
                      })
                    }

                    {/*  New items being composed  */}
                    {newItems.map((item) => (
                      <tr key={item._id} className="bg-blue-50/20" style={{ overflow: "visible" }}>
                        {/* SKU NAME — dropdown */}
                        <td className="px-3 py-3 w-[280px]">
                          <SkuSearchDropdown
                            selectedSku={item.sku}
                            onSelect={(sku) => handleNewItemSkuSelect(item._id, sku)}
                            excludedSkuIds={allSelectedSkuIds.filter((id) => id !== item.sku?.id)}
                          />
                          {item?.sku?.is_bundle_sku && (
                            <span className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                              <Package className="w-2.5 h-2.5" />
                              Bundle ×{item?.sku?.bundle_factor}
                            </span>
                          )}
                        </td>
                        {/* SKU CODE */}
                        <td className="py-3 w-[60px]" title={item?.product_sku?.sku_code ?? ""}>
                          {item.sku ? (
                            <span className="text-[11px] truncate text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded">
                              {item.sku.sku_code}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        {/* QUANTITY */}
                        <td className="px-0.1 py-3 w-3">
                          {item?.sku?.is_bundle_sku ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="number"
                                min={0}
                                value={item.quantity}
                                disabled={!item.sku || cartStatus === "checkout"}
                                onChange={(e) => handleNewItemQtyChange(item._id, e.target.value)}
                                placeholder="0"
                                className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                                onWheel={(e) => e.target.blur()}
                              />
                              {!item._looseQty && item.quantity > 0 && (
                                <span className="text-[10px] font-medium">
                                  Total: {Number(item.quantity) * item.sku.bundle_factor}
                                </span>)}

                              {item._looseQty > 0 && (
                                <span className="text-[10px] text-slate-500">
                                  +{item._looseQty} loose&nbsp;|&nbsp;
                                  <span className="font-semibold">
                                    Total: {Number(item.quantity) * item.sku.bundle_factor + item._looseQty}
                                  </span>
                                </span>
                              )}
                              {cartStatus !== "checkout" && (
                                <span
                                  className="text-[12px] cursor-pointer text-primary hover:underline w-fit"
                                  onClick={() => {
                                    setLoosePopupTarget({ mode: "new", item });
                                    setIsLooseSkuPopupOpen(true);
                                  }}
                                >
                                  {item._looseQty > 0 ? "Edit loose sku" : "Add loose sku"}
                                </span>
                              )}
                            </div>
                          ) : (
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              disabled={!item.sku || cartStatus === "checkout"}
                              onChange={(e) => handleNewItemQtyChange(item._id, e.target.value)}
                              placeholder="Qty"
                              className="w-20 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                              onWheel={(e) => e.target.blur()}
                            />
                          )}
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

                    {/*  Empty state  */}
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

          {/*  Add another Item  */}
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


          {/*Coupon and Actions row  */}
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
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-blue-100 bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-mono font-bold text-primary bg-white border border-blue-100 px-2 py-0.5 rounded">
                      {appliedCoupons[0].code}
                    </span>
                    <span className="text-xs text-gray-500">
                      {appliedCoupons[0]?.discount_type === "percentage"
                        ? `${appliedCoupons[0].discount_value}% off`
                        : `${fmt(appliedCoupons[0].discount_value)} off`}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs font-semibold text-green-600">{fmt(appliedCoupons[0].discount_amount)} saved</span>
                  </div>
                  <button
                    title="Remove coupon"
                    onClick={handleRemoveCoupon}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  >
                    {isRemovingCoupon ? <Loader2 size={14} /> : <X size={14} />}
                  </button>
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

          {/*  Order Summary (only when not editing)  */}
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

        {isLooseSkuPopupOpen && loosePopupTarget && (
          <LooseQtyPopup
            mode={loosePopupTarget.mode}
            item={loosePopupTarget.item}
            onClose={() => setIsLooseSkuPopupOpen(false)}
            onConfirm={handleLooseConfirm}
          />
        )}
      </div>
    </>
  );
}