"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import DataTable from "../../../../../../components/shared/DataTable";
import EditSkuMappingModal from "./EditSkuMappingModal";
import MapSkuModal from "./MapSkuModal";
import { getSkuMappings } from "./skuMappingApi";
import VendorDetaislSkuTabSkeleton from "./VendorDetailsSkuTabSkeleton";

// ─── Table Columns ───────────────────────────────────────────────────────────

function buildColumns(onEdit) {
  return [
    {
      key: "product_sku.sku_name",
      label: "SKU Name",
      render: (_, row) => (
        <div>
          <p className="text-[13px] font-medium text-gray-800 leading-tight">
            {row.product_sku?.sku_name ?? "—"}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{row.product_sku?.sku_code ?? ""}</p>
        </div>
      ),
    },
    {
      key: "vendor_sku_code",
      label: "Vendor SKU Code",
      render: (value) => (
        <span className="font-mono text-[12.5px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          {value ?? "—"}
        </span>
      ),
    },
    {
      key: "vendor_unit_price",
      label: "Unit Price",
      render: (value) => (
        <span className="text-[13px] font-medium text-gray-800">
          ₹{parseFloat(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "active",
      label: "Status",
      render: (value) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold
            ${value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function VendorSkuMappingTab({ vendorId }) {
  const [mappings, setMappings] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, total_pages: 1, total_data_count: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [editingMapping, setEditingMapping] = useState(null); // for edit modal
  const [showMapModal, setShowMapModal] = useState(false);     // for map sku modal

  const fetchMappings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data, meta: m } = await getSkuMappings(vendorId, page);
      setMappings(data);
      setMeta(m);
    } catch (err) {
      toast.error(err.message || "Failed to load SKU mappings");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchMappings(currentPage);
  }, [fetchMappings, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const columns = buildColumns((row) => setEditingMapping(row));

  return (
    <div className="flex flex-col gap-3">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-gray-800">Vendor SKUs</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {meta.total_data_count ?? 0} mapping{(meta.total_data_count ?? 0) !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowMapModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium shadow-sm transition hover:scale-105 cursor-pointer bg-primary text-white hover:bg-primary/90 text-[13px]"
        >
          <Plus size={14} strokeWidth={2.5} />
          Map SKU to Vendor
        </button>
      </div>

      {/* Table */}
      {loading ? (
        // <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-center h-48">
        //   <div className="flex items-center gap-2.5 text-gray-400">
        //     <Loader2 size={16} className="animate-spin" />
        //     <span className="text-[13px]">Loading SKU mappings…</span>
        //   </div>
        // </div>
        <VendorDetaislSkuTabSkeleton />
      ) : mappings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Plus size={18} className="text-gray-400" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium text-gray-600">No SKU mappings yet</p>
            <p className="text-[12px] text-gray-400 mt-1">Click "Map SKU to Vendor" to add mappings.</p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={mappings}
          rowKey="id"
          currentPage={meta.current_page}
          totalPages={meta.total_pages}
          onPageChange={handlePageChange}
          onActionClick={(row) => setEditingMapping(row)}
        />
      )}

      {/* Edit Modal */}
      {editingMapping && (
        <EditSkuMappingModal
          vendorId={vendorId}
          mapping={editingMapping}
          onClose={() => setEditingMapping(null)}
          onSaved={() => fetchMappings(currentPage)}
        />
      )}

      {/* Map SKU Modal */}
      {showMapModal && (
        <MapSkuModal
          vendorId={vendorId}
          onClose={() => setShowMapModal(false)}
          onSaved={() => {
            setCurrentPage(1);
            fetchMappings(1);
          }}
        />
      )}
    </div>
  );
}