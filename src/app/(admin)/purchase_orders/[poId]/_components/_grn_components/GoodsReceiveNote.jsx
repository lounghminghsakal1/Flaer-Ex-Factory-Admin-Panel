"use client";
import { useState, useEffect,useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Package,
  Edit2,
  CheckCircle,
  FileText,
  CalendarDays,
  MapPin,
  Hash,
  ExternalLink,
  Loader2,
  X,
  Send,
  MoreVertical
} from "lucide-react";
import { toast } from "react-toastify";
import GrnFormModal from "./GrnFormModal";
import GrnLineItems from "./GrnLineItems";

// ─── Stat Cards ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color = "gray" }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-bold text-${color}-700`}>
        ₹{Number(value || 0).toLocaleString()}
      </span>
    </div>
  );
}

function QtyCard({ label, value, color = "gray" }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-bold text-${color}-700`}>{value ?? 0}</span>
    </div>
  );
}

// ─── Single GRN Accordion ─────────────────────────────────────────────────────
function GrnAccordion({ grn, index, isOpen, onToggle, poId, vendorId, onRefresh }) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [lineItems, setLineItems] = useState(null); // null = not yet loaded
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [sendingToQC, setSendingToQC] = useState(false);
  const [canSendToQC, setCanSendToQC] = useState(false);

  const [submittedQC, setSubmittedQC] = useState(false);
  const [canComplete, setCanComplete] = useState(false);
  const [isLineItemsEditing, setIsLineItemsEditing] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const canCancel = grn.status === "created" || grn.status === "qc_pending";
  const hasMenuItems = canCancel; // extend here as you add more options

  const formatDate = (str) => {
    if (!str) return "--";
    const d = new Date(str);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Fetch GRN detail (with line_items) once when accordion opens
  useEffect(() => {
    if (!isOpen || lineItems !== null) return; // only fetch once
    setLoadingDetail(true);
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/${grn.id}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setLineItems(data.data?.line_items || []);
        } else {
          toast.error("Failed to load GRN details.");
          setLineItems([]);
          throw new Error(data?.errors[0] ?? "Something went wrong");
        }
      })
      .catch((err) => {
        toast.error("Failed to load GRN details "+err.message);
        setLineItems([]);
      })
      .finally(() => setLoadingDetail(false));
  }, [isOpen, grn.id, lineItems]);

  const handleGrnUpdated = () => {
    setEditModalOpen(false);
    onRefresh();
  };

  // Called from GrnLineItems after a successful save — re-fetch detail
  const handleLineItemsSaved = () => {
    setLineItems(null); // reset so next open re-fetches
    // Immediately re-fetch since accordion is still open
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/${grn.id}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setLineItems(data.data?.line_items || []);
        } else {
          throw new Error(data?.errors[0] ?? "Something went wrong");
        }
      })
      .catch((err) => { 
        console.log(err);
        toast.error("Failed to save GRN line items "+ err.message);
      });
    onRefresh(); // refresh the list-level data (totals etc.)
  };

  const handleCompleteGrn = async () => {
    try {
      setCompleting(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/${grn.id}/complete`;
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (!res.ok || data.status === "failure") {
        throw new Error(data?.errors[0]);
      }
      toast.success("GRN completed successfully");
      onRefresh();
    } catch (err) {
      console.log(err);
      toast.error("Failed to complete GRN " + err.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleCancelGrn = async () => {
    setCancelling(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/${grn.id}/cancel`;
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (!res.ok || data.status === "failure") {
        throw new Error(data?.errors[0] ?? "Something went wrong");
      }
      toast.success("GRN cancelled successfully");
      onRefresh();
    } catch (err) {
      toast.error("Failed to cancel GRN " + err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleSendToQC = async () => {
    try {
      setSendingToQC(true);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes/${grn.id}/initiate_qc`;
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (!res.ok || data.status === "failure") {
        throw new Error(data?.errors[0] ?? "Something went wrong");
      }
      toast.success("GRN sent to QC successfully");
      onRefresh();
    } catch (err) {
      toast.error("Failed to send GRN to QC " + err.message);
    } finally {
      setSendingToQC(false);
    }
  }

  return (
    <>
      <GrnFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSaved={handleGrnUpdated}
        poId={poId}
        vendorId={vendorId}
        grn={grn}
      />

      <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div
          role="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
              {index + 1}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-gray-900">{grn.grn_number || `GRN #${grn.id}`}</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${grn.status === "completed"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : grn.status === "draft"
                      ? "bg-gray-100 text-gray-600"
                      : grn.status === "cancelled" ? " bg-red-100 text-red-600" : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                >
                  {grn.status || "draft"}
                </span>
              </div>
              {/* Collapsed summary */}
              {!isOpen && (
                <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <CalendarDays className="w-3 h-3" />
                    {formatDate(grn.received_date)}
                  </span>
                  {grn?.node?.name && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {grn.node.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Hash className="w-3 h-3" />
                    {grn.vendor_invoice_no || "--"}
                  </span>
                  <span className="text-xs text-gray-400">
                    Received:{" "}
                    <span className="font-semibold text-gray-700">
                      ₹{Number(grn.total_received_amount || 0).toLocaleString()}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400">
                    Accepted:{" "}
                    <span className="font-semibold text-green-600">
                      ₹{Number(grn.total_accepted_amount || 0).toLocaleString()}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400">
                    Rejected:{" "}
                    <span className="font-semibold text-red-500">
                      ₹{Number(grn.total_rejected_amount || 0).toLocaleString()}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {isOpen && grn.status !== "completed" && (
              <div
                role="button"
                onClick={() => setEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary hover:text-gray-100 cursor-pointer transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                Update GRN
              </div>
            )}

            {hasMenuItems && (
              <div className="relative" ref={menuRef}>
                <div
                  role="button"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((prev) => !prev); }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${menuOpen
                      ? "bg-gray-100 text-gray-700"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                  aria-label="More options"
                >
                  <MoreVertical className="w-4 h-4" />
                </div>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                    {canCancel && (
                      <div
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          handleCancelGrn();
                        }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        {cancelling ? "Cancelling..." : "Cancel GRN"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="cursor-pointer"
            >
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Body */}
        {isOpen && (
          <div className="px-4 pb-5 border-t border-gray-100 pt-4 space-y-4">
            {/* GRN Details */}
            <div className="grid grid-cols-5 gap-3 ">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400">Node</span>
                <span className="text-sm font-medium text-gray-800">{grn?.node?.name || "--"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400">Vendor Invoice No.</span>
                <span className="text-sm font-medium text-gray-800">{grn.vendor_invoice_no || "--"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400">Vendor Invoice Date</span>
                <span className="text-sm font-medium text-gray-800">{formatDate(grn.vendor_invoice_date)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400">Received Date</span>
                <span className="text-sm font-medium text-gray-800">{formatDate(grn.received_date)}</span>
              </div>
              {grn.vendor_invoice_s3_url && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">GRN Invoice</span>
                  <a
                    href={grn.vendor_invoice_s3_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Download Invoice
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* 6 key stats */}
            <div className="grid grid-cols-6 gap-2 ">
              <QtyCard label="Total Received Qty" value={Math.trunc(grn.total_received_quantity)} />
              <QtyCard label="Total Accepted Qty" value={Math.trunc(grn.total_accepted_quantity)} color="green" />
              <QtyCard label="Total Rejected Qty" value={Math.trunc(grn.total_rejected_quantity)} color="red" />
              <StatCard label="Total Received Amt." value={grn.total_received_amount} />
              <StatCard label="Total Accepted Amt." value={grn.total_accepted_amount} color="green" />
              <StatCard label="Total Rejected Amt." value={grn.total_rejected_amount} color="red" />
            </div>

            {/* Line items */}
            {loadingDetail ? (
              <div className="flex items-center gap-2 py-6 justify-center text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading line items…</span>
              </div>
            ) : (
              <GrnLineItems
                grnId={grn.id}
                poId={poId}
                grnStatus={grn.status}
                initialLineItems={lineItems || []}
                onSaved={handleLineItemsSaved}
                setCanSendToQC={setCanSendToQC}
                submittedQC={submittedQC}
                setSubmittedQC={setSubmittedQC}
                setCanComplete={setCanComplete}
                setIsLineItemsEditing={setIsLineItemsEditing}
                setHasSubmitted={setHasSubmitted}
              />
            )}

            <div className="flex justify-end items-center gap-3">
              {/* {(grn.status === "created" || grn.status === "qc_pending") && (
                <div className="flex justify-end pt-1">
                  <div
                    role="button"
                    onClick={() => {
                      handleCancelGrn();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-gray-100 text-sm font-semibold rounded-md cursor-pointer hover:scale-103 transition-all hover:opacity-80"
                  >
                    <X className="w-4 h-4" />
                    {cancelling ? "Cancelling..." : "Cancel GRN"}
                  </div>
                </div>
              )} */}

              {grn.status === "created" && (lineItems !== null && lineItems.length > 0) && (
                <div className="flex justify-end pt-1">
                  <div
                    role="button"
                    onClick={() => {
                      if (isLineItemsEditing) {
                        toast.error("First finish editing line items");
                        return;
                      }
                      handleSendToQC();
                    }}
                    className={`flex items-center gap-2 px-5 py-2 ${isLineItemsEditing ? "bg-gray-600" : " bg-green-600"} text-gray-100 text-sm font-semibold rounded-md cursor-pointer hover:scale-103 transition-all hover:opacity-80`}
                  >
                    <Send className="w-4 h-4" />
                    {sendingToQC ? "Proceeding..." : "Proceed to QC"}
                  </div>
                </div>
              )}

              {/* Complete GRN */}
              {grn.status === "qc_pending" && (
                <div className="flex justify-end pt-1">
                  <div
                    role="button"
                    onClick={() => {
                      if (isLineItemsEditing) {
                        toast.error("First finish editing line items");
                        return;
                      }
                      if (!canComplete) {
                        toast.error("Complete QC check for all GRN line items");
                        return;
                      }
                      if (!hasSubmitted) {
                        toast.error("Finish QC Check first");
                        return;
                      }
                      handleCompleteGrn();
                    }}
                    className={`flex items-center gap-2 px-5 py-2 ${canComplete ? "bg-primary" : "bg-gray-600"}  text-gray-100 text-sm font-semibold rounded-md cursor-pointer hover:scale-103 transition-all hover:opacity-80`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {completing ? "completing..." : "Complete GRN"}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GoodsReceiveNote({ poId, vendorId }) {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [meta, setMeta] = useState({});

  const [lastGrnCreatedId, setLastGrnCreatedId] = useState(null);

  const fetchGrns = async (forceOpenId = null) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/procurement/goods_received_notes?purchase_order_id=${poId}`
      );
      const data = await res.json();
      if (data.status === "success") {
        const list = [...(data.data || [])].sort((a, b) => b.id - a.id);
        setGrns(list);
        setMeta(data.meta || {});
        if (list.length > 0) setOpenAccordion((prev) => {
          if (forceOpenId) {
            const exists = list.find(grn => grn.id === forceOpenId);
            if (exists) {
              return forceOpenId;
            }
          }
          if (prev && list.some(grn => grn.id === prev)) {
            return prev;
          }
          return list[0].id;
        });
      }
      if (data.status === "failure") throw new Error(data?.errors?.[0] ?? "Something went wrong");
    } catch (err) {
      toast.error("Failed to fetch GRNs: " + err.message);
    }
  };

  useEffect(() => {
    fetchGrns().finally(() => setLoading(false));
  }, [poId]);

  const handleGrnCreated = (newGrn) => {
    setCreateModalOpen(false);
    fetchGrns(newGrn.id);
  };

  const canCreate = () => {
    const allowedStatuses = ["completed", "cancelled"];
    const hasInCompletedGRNs = grns.some(grn => !allowedStatuses.includes(grn.status));
    if (hasInCompletedGRNs) return false;
    return true;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading GRNs…</span>
      </div>
    );
  }

  return (
    <>
      <GrnFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSaved={handleGrnCreated}
        poId={poId}
        vendorId={vendorId}
        grn={null}
      />

      <div className="w-full mx-auto px-1 py-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Goods Receive Notes</h2>
            {meta.total_data_count !== undefined && (
              <p className="text-sm text-gray-400 mt-0.5">
                {meta.total_data_count} GRN{meta.total_data_count !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div
            role="button"
            onClick={() => {
              if (!canCreate()) {
                toast.error("Finish existing GRNs first");
                return;
              }
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md hover:scale-103 hover:opacity-90 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create GRN
          </div>
        </div>

        {/* GRN List */}
        <div className="space-y-3">
          {grns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
              <Package className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No GRNs yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Click "Create GRN" to add the first goods receive note.
              </p>
              <div
                role="button"
                onClick={() => {
                  if (!canCreate()) {
                    toast.error("Finish existing GRNs first");
                    return;
                  }
                  setCreateModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-md hover:scale-103 hover:opacity-90 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create GRN
              </div>
            </div>
          ) : (
            grns.map((grn, idx) => (
              <GrnAccordion
                key={grn.id}
                grn={grn}
                index={idx}
                isOpen={openAccordion === grn.id}
                onToggle={() =>
                  setOpenAccordion((prev) => (prev === grn.id ? null : grn.id))
                }
                poId={poId}
                vendorId={vendorId}
                onRefresh={fetchGrns}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}