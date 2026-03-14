"use client";

import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import CheckedOutPage from "./CheckedOutPage";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const DELIVERY_TYPES = [
  { value: "home_delivery", label: "Home Deleivery" },
  { value: "pickup", label: "Pickup" },
  { value: "self_pickup", label: "Self Pickup" },
  { value: "third_party_delivery", label: "Third Party Delivery" },
];

const DELIVERY_TIMES = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
];

export default function CheckoutForm({ cartData,customerId, onBack, fetchCart }) {
  const router = useRouter();
  const cartId = cartData.id;

  const [pocName, pocMobile] = cartData?.delivery_info?.poc_details ? cartData?.delivery_info?.poc_details.split(" - ") : ["", ""];

  const [form, setForm] = useState({
    delivery_type: cartData.delivery_type ?? "",
    handle_with_care: cartData?.handle_with_care ?? false,
    poc_name: pocName ?? "",
    poc_mobile: pocMobile ?? "",
    preferred_delivery_time: cartData?.delivery_info?.prefered_delivery_time ?? "",
    driver_name: cartData?.deliverer_details?.driver_name ?? "",
    vehicle_number: cartData?.deliverer_details?.vehicle_number ?? "",
    driver_mobile_number: cartData?.deliverer_details?.driver_mobile_number ?? "",
    floor_number: cartData?.info_for_labour?.floor_number ?? "",
    ground_floor_included: cartData?.info_for_labour?.ground_floor_included ?? false,
    permitted_by_owner: cartData?.info_for_labour?.permitted_by_owner ?? false,
  });

  const [loading, setLoading] = useState(false);

  // const needsDriverInfo =
  //   form.delivery_type === "ex_factory_vehicle" ||
  //   form.delivery_type === "own_vehicle";

  const needsDriverInfo = true;
  const [isCheckedOut, setIsCheckedOut] = useState(cartData?.status === "checkout");
  const [checkedOutCartData, setCheckedOutCartData]= useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.delivery_type) return "Please select a delivery type.";
    if (!form.preferred_delivery_time) return "Please select a preferred delivery time.";
    if (needsDriverInfo) {
      if (!form.driver_name.trim()) return "Driver name is required.";
      if (!form.vehicle_number.trim()) return "Vehicle number is required.";
      if (!form.driver_mobile_number.trim()) return "Driver mobile number is required.";
      if (!/^\d{10}$/.test(form.driver_mobile_number))
        return "Driver mobile number must be 10 digits.";
    }
    if (form.floor_number !== "" && isNaN(Number(form.floor_number)))
      return "Floor number must be a valid number.";
    return null;
  };

  const buildPayload = () => {
    const poc = [form.poc_name.trim(), form.poc_mobile.trim()].filter(Boolean).join(" - ");
    return {
      shipping_address_id: 1,
      billing_address_id: 2,
      delivery_type: form.delivery_type,
      delivery_info: {
        audio_url: "https://s3.amazonaws.com/audio/123.mp3",
        handle_with_care: form.handle_with_care,
        poc_details: poc,
        prefered_delivery_time: form.preferred_delivery_time,
      },
      delivery_type_details: needsDriverInfo
        ? {
          driver_name: form.driver_name,
          vehicle_number: form.vehicle_number,
          driver_mobile_number: form.driver_mobile_number,
        }
        : {},
      info_for_labours: {
        floor_number: form.floor_number !== "" ? Number(form.floor_number) : 0,
        ground_floor_included: form.ground_floor_included,
        permitted_by_owner: form.permitted_by_owner,
      },
    };
  };

  const handleSubmit = async () => {
    // const validationError = validate();
    // if (validationError) {
    //   toast.error(validationError);
    //   return;
    // }
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/admin/api/v1/sales/carts/${cartId}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        }
      );
      const json = await res.json();
      if (!res.ok || json.status === "failure")
        throw new Error(json?.errors?.[0] ?? `Request failed with status ${res.status}`);
      setCheckedOutCartData(json?.data ?? null);
      setIsCheckedOut(true);
      toast.success("Checkout successful!");
    } catch (err) {
      toast.error("Checkout failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (isCheckedOut) return <CheckedOutPage cartData={checkedOutCartData} onBack={onBack} customerId={customerId} />

  return (
    <div className="w-full mx-auto py-4">

      {/*  Page Title row  */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 cursor-pointer font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
        <h1 className="text-xl font-bold text-blue-900 tracking-tight">Checkout</h1>
        <div className="w-24" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

        {/*  Delivery Details  */}
        <SectionHeader title="Delivery Details" />
        <div className="px-4 py-4 grid grid-cols-2 gap-4 border-b border-gray-100">

          <Field label="Delivery Type" >
            <select
              value={form.delivery_type}
              onChange={(e) => handleChange("delivery_type", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white cursor-pointer"
            >
              <option value="">Select delivery type</option>
              {DELIVERY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Preferred Delivery Time" >
            <select
              value={form.preferred_delivery_time}
              onChange={(e) => handleChange("preferred_delivery_time", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-white cursor-pointer"
            >
              <option value="">Select time slot</option>
              {DELIVERY_TIMES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Point/Person of Contact — Name">
            <input
              type="text"
              value={form.poc_name}
              onChange={(e) => handleChange("poc_name", e.target.value)}
              placeholder="e.g. John"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
            />
          </Field>

          <Field label="Point/Person of Contact — Mobile">
            <input
              type="tel"
              value={form.poc_mobile}
              onChange={(e) => handleChange("poc_mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
            />
          </Field>

          <div className="col-span-2">
            <CheckboxRow
              label="Handle with Care"
              checked={form.handle_with_care}
              onChange={(v) => handleChange("handle_with_care", v)}
            />
          </div>

        </div>

        {/*  Vehicle and  Driver Details  */}
        {needsDriverInfo && (
          <>
            <SectionHeader title="Vehicle & Driver Details" />
            <div className="px-4 py-4 grid grid-cols-2 gap-4 border-b border-gray-100">

              <Field label="Driver Name" >
                <input
                  type="text"
                  value={form.driver_name}
                  onChange={(e) => handleChange("driver_name", e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </Field>

              <Field label="Vehicle Number" >
                <input
                  type="text"
                  value={form.vehicle_number}
                  onChange={(e) => handleChange("vehicle_number", e.target.value.toUpperCase())}
                  placeholder="e.g. TS09AB1234"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </Field>

              <Field label="Driver Mobile Number" >
                <input
                  type="tel"
                  value={form.driver_mobile_number}
                  onChange={(e) =>
                    handleChange("driver_mobile_number", e.target.value.replace(/\D/, "").slice(0, 10))
                  }
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </Field>

            </div>
          </>
        )}

        {/*  Labour Instructions  */}
        <SectionHeader title="Labour Instructions" />
        <div className="px-4 py-4 grid grid-cols-2 gap-4 border-b border-gray-100">

          <Field label="Floor Number">
            <input
              type="number"
              min={0}
              value={form.floor_number}
              onChange={(e) => handleChange("floor_number", e.target.value.replace(/[^0-9]/, ""))}
              placeholder="e.g. 3"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              onWheel={(e) => e.target.blur()}
            />
          </Field>

          <div className="flex flex-col gap-5 justify-center">
            <CheckboxRow
              label="Ground Floor Included"
              checked={form.ground_floor_included}
              onChange={(v) => handleChange("ground_floor_included", v)}
            />
            <CheckboxRow
              label="Permitted by Owner"
              checked={form.permitted_by_owner}
              onChange={(v) => handleChange("permitted_by_owner", v)}
            />
          </div>

        </div>

        {/*  Footer  */}
        <div className="px-8 py-5 flex items-center justify-end">
          {/* <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 cursor-pointer font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </button> */}

          {cartData.status === "active" && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-primary hover:opacity-80 active:bg-blue-950 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-6 rounded-md transition-colors cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Processing..." : "Confirm Checkout"}
            </button>
          )}

        </div>

      </div>
    </div>
  );
}


function SectionHeader({ title }) {
  return (
    <div className="flex items-center px-8 py-4 border-b border-gray-100">
      <h2 className="text-base font-bold text-blue-900">{title}</h2>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-primary rounded border-gray-300 cursor-pointer"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}