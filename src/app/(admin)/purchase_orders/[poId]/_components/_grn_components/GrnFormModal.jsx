"use client";
import { useState, useEffect } from "react";
import { X, Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import DatePicker from "../../../create/_components/DatePicker";
import SearchableDropdown from "../../../create/_components/SearchableDropdown";

/**
 * GrnFormModal
 * Props:
 *  - isOpen: bool
 *  - onClose: fn()
 *  - onSaved: fn(grn) - called after create/update success
 *  - poId: number
 *  - vendorId: number
 *  - grn: existing GRN object | null (null = create mode)
 */
export default function GrnFormModal({ isOpen, onClose, onSaved, poId, vendorId, grn = null }) {
  const isEdit = !!grn; //this line is exactly equals to === const isEdit = Boolean(grn); means if grn object exists then its edit mode else create mode

  // Form state
  const [nodeId, setNodeId] = useState(null);
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState(null);
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState("");
  const [receivedDate, setReceivedDate] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Node options - dummy + real
  const [nodeOptions, setNodeOptions] = useState([
    { value: 1, label: "Node One" },
    { value: 2, label: "Node Two" },
    { value: 3, label: "Node Three" },
  ]);

  // Populate form on edit
  useEffect(() => {
    if (!isOpen) return;
    if (grn) {
      setNodeId(grn.node_id ? { value: grn.node_id, label: grn.node_name || `Node #${grn.node_id}` } : null);
      setVendorInvoiceDate(grn.vendor_invoice_date ? new Date(grn.vendor_invoice_date) : null);
      setVendorInvoiceNo(grn.vendor_invoice_no || "");
      setReceivedDate(grn.received_date ? new Date(grn.received_date) : null);
      setMediaUrl(grn.vendor_invoice_s3_url || null);
      setMediaFile(null);
    } else {
      setNodeId(null);
      setVendorInvoiceDate(null);
      setVendorInvoiceNo("");
      setReceivedDate(null);
      setMediaFile(null);
      setMediaUrl(null);
    }
  }, [isOpen, grn]);

  // Fetch node options
  useEffect(() => {
    if (!isOpen) return;
    const fetchNodes = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/locations/nodes?only_names=true`
        );
        const data = await res.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          const opts = data.data.map((n) => ({ value: n.id, label: n.name }));
          if (opts.length > 0) setNodeOptions(opts);
        }
        if (data.status === "failure") throw new Error(data?.errors[0]);
      } catch(err) {
        // keep dummy options
        toast.error("Failed to fetch nodes list "+err);
      }
    };
    fetchNodes();
  }, [isOpen]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/upload_media`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.status === "success") {
        setMediaUrl(data.data.media_url);
        toast.success("File uploaded successfully.");
      } else {
        //toast.error(data?.errors[0] || "File upload failed.");
        setMediaFile(null);
        throw new Error(data?.errors[0]);
      }
    } catch(err) {
      toast.error("File upload failed "+err);
      setMediaFile(null);
    } finally {
      setUploading(false);
    }
  };

  const formatDateForApi = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handleSubmit = async () => {
    if (!nodeId) { toast.error("Please select a node."); return; }
    if (!vendorInvoiceDate) { toast.error("Please select vendor invoice date."); return; }
    if (!vendorInvoiceNo.trim()) { toast.error("Please enter vendor invoice number."); return; }
    if (!receivedDate) { toast.error("Please select received date."); return; }

    const payload = {
      grn: {
        purchase_order_id: poId,
        vendor_id: vendorId,
        node_id: nodeId.value,
        vendor_invoice_date: formatDateForApi(vendorInvoiceDate),
        vendor_invoice_no: vendorInvoiceNo.trim(),
        received_date: formatDateForApi(receivedDate),
        direct_grn: false,
        vendor_invoice_s3_url: mediaUrl || null,
      },
    };

    setSaving(true);
    try {
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/${grn.id}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes?po_id=${poId}`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(isEdit ? "GRN updated successfully." : "GRN created successfully.");
        onSaved(data.data);
        onClose();
      } else {
        throw new Error(data?.errors[0]);
      }
    } catch(err) {
      console.log(err);
      toast.error("Failed to create GRN "+err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-visible">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? "Update GRN" : "GRN Info"}
            </h2>
            <div className="flex items-center gap-3">
              {/* <div
                role="button"
                onClick={!saving ? handleSubmit : undefined}
                className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md transition-opacity cursor-pointer ${
                  saving ? "opacity-60" : "hover:opacity-90"
                }`}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? "Update GRN" : "Save GRN"}
              </div> */}
              <div
                role="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            {/* Select Node */}
            <div>
              <SearchableDropdown
                label="Select Node"
                required
                placeholder="Select..."
                options={nodeOptions}
                value={nodeId}
                onChange={setNodeId}
              />
            </div>

            {/* GRN Number (readonly on edit) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GRN Number</label>
              <input
                readOnly
                value={grn?.grn_number || ""}
                placeholder="GRN Number"
                className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500"
              />
            </div>

            {/* Vendor Invoice Date */}
            <div>
              <DatePicker
                label="Vendor Invoice Date"
                required
                value={vendorInvoiceDate}
                onChange={setVendorInvoiceDate}
                disablePast={false}
                disableFuture
              />
              {/* Validate no future date */}
            </div>

            {/* Vendor Invoice No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Invoice No. <span className="text-red-500">*</span>
              </label>
              <input
                value={vendorInvoiceNo}
                onChange={(e) => setVendorInvoiceNo(e.target.value)}
                placeholder="vendor invoice No."
                className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Received Date */}
            <div>
              <DatePicker
                label="Received Date"
                required
                value={receivedDate}
                onChange={setReceivedDate}
                disablePast={false}
                dropUp={true}
                disableFuture
              />
            </div>

            {/* Upload Vendor Invoice */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Vendor Invoice{" "}
                <span className="text-xs font-normal text-gray-400">
                  (application/pdf, image/png, image/jpeg, image/webp, image/jpg)*
                </span>
              </label>
              <label className="flex items-center gap-2 w-fit px-4 py-2 border border-primary text-primary text-sm font-medium rounded-xl cursor-pointer hover:bg-primary hover:text-gray-100 transition-all">
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Choose File"}
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {(mediaFile || mediaUrl) && (
                <div className="flex items-center gap-2 mt-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600 truncate max-w-[200px]">
                    {mediaFile ? mediaFile.name : "Existing file"}
                  </span>
                  {uploading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end border-t mb-4">
            <div className="w-20 items-center mt-2 mr-2 px-4 py-2 bg-gray-600 hover:scale-103 text-white text-sm font-semibold rounded-md transition-all cursor-pointer hover:opacity-70" onClick={onClose} >
              Cancel
            </div>
            <div
                role="button"
                onClick={!saving ? handleSubmit : undefined}
                className={`flex w-28 mr-10 mt-2 items-center gap-2 px-4 py-2 bg-green-600 hover:scale-103 text-white text-sm font-semibold rounded-md transition-all cursor-pointer ${
                  saving ? "opacity-60" : "hover:opacity-90"
                }`}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? "Update GRN" : "Save GRN"}
              </div>
          </div>
        </div>
      </div>
    </>
  );
}