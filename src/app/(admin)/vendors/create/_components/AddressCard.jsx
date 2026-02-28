"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { toast } from "react-toastify";

function Field({ label, required, error, muted, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`text-[13px] font-medium ${muted ? "text-gray-400" : "text-gray-700"}`}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

const inputCls = (hasError, disabled) =>
  `h-9 px-3 py-2 text-[13px] rounded-md border-1 outline-none w-[95%] transition-all
  placeholder:text-gray-300 text-gray-800
  ${disabled
    ? "bg-gray-50 text-gray-600 border-gray-100 cursor-default"
    : hasError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-white"
      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 bg-white"
  }`;

export default function AddressCard({ form, errors = {}, onChange, isEditing = true }) {
  const [pincodeError, setPincodeError] = useState("");
  const [loading, setLoading] = useState(false);

  const globalDisabled = !isEditing;
  // In view mode: city/state/country always editable by address lock logic only if isEditing
  const addressLocked = isEditing && form.pincode.length < 6;

  const handlePincode = async (value) => {
    if (globalDisabled) return;
    const digits = value.replace(/\D/g, "").slice(0, 6);
    onChange("pincode", digits);

    if (digits.length > 0 && digits.length < 6) {
      setPincodeError("Invalid pincode");
      onChange("city", "");
      onChange("state", "");
      onChange("country", "");
    } else if (digits.length === 6) {
      setPincodeError("");
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/vendors/fetch_picode_details?pin_code=${digits}`
        );
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        if (json.status === "success" && json.data) {
          onChange("city", json.data.city || "");
          onChange("state", json.data.state || "");
          onChange("country", "India");
        } else {
          throw new Error(json.errors[0] || "Invalid pincode");
        }
      } catch {
        setPincodeError("Could not fetch location for this pincode");
        toast.error("Pincode not found. Enter city and state manually.");
        onChange("city", "");
        onChange("state", "");
        onChange("country", "");
      } finally {
        setLoading(false);
      }
    } else {
      setPincodeError("");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-gray-200">
        <MapPin size={18} className="text-gray-400" strokeWidth={1.8} />
        <h2 className="text-lg font-semibold text-gray-800">Billing Address</h2>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <Field label="Address Line 1">
          <input className={inputCls(false, globalDisabled)} placeholder="Street, building, flat no."
            value={form.address1} readOnly={globalDisabled}
            onChange={(e) => !globalDisabled && onChange("address1", e.target.value)} />
        </Field>

        <Field label="Address Line 2">
          <input className={inputCls(false, globalDisabled)} placeholder="Area, landmark (optional)"
            value={form.address2} readOnly={globalDisabled}
            onChange={(e) => !globalDisabled && onChange("address2", e.target.value)} />
        </Field>

        <Field label="Pincode" required={isEditing} error={pincodeError || errors.pincode}>
          <div className="relative">
            <input
              className={inputCls(!!(pincodeError || errors.pincode), globalDisabled)}
              placeholder="6-digit pincode"
              maxLength={6}
              value={form.pincode}
              readOnly={globalDisabled}
              onChange={(e) => handlePincode(e.target.value)}
            />
            {loading && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-3.5 w-3.5 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </span>
            )}
          </div>
        </Field>

        <Field label="City" muted={addressLocked}>
          <input
            className={inputCls(false, globalDisabled || addressLocked)}
            placeholder="Auto-filled from pincode"
            value={form.city}
            readOnly={globalDisabled || addressLocked}
            onChange={(e) => !globalDisabled && !addressLocked && onChange("city", e.target.value)}
          />
        </Field>

        <Field label="State" muted={addressLocked}>
          <input
            className={inputCls(false, globalDisabled || addressLocked)}
            placeholder="Auto-filled from pincode"
            value={form.state}
            readOnly={globalDisabled || addressLocked}
            onChange={(e) => !globalDisabled && !addressLocked && onChange("state", e.target.value)}
          />
        </Field>

        <Field label="Country" muted={addressLocked}>
          <input
            className={inputCls(false, globalDisabled || addressLocked)}
            placeholder="Auto-filled from pincode"
            value={form.country}
            readOnly={globalDisabled || addressLocked}
            onChange={(e) => !globalDisabled && !addressLocked && onChange("country", e.target.value)}
          />
        </Field>
      </div>

      {addressLocked && (
        <p className="mt-3 text-[11px] text-gray-400 border-l-2 border-blue-400 pl-2 bg-blue-50 py-1 rounded-r">
          Enter a valid 6-digit pincode — city, state &amp; country will be auto-filled.
        </p>
      )}
    </div>
  );
}