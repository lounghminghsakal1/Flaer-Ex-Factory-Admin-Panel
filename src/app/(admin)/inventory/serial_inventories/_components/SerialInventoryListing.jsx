"use client";

import { useState } from "react";
import DataTable from "../../../../../../components/shared/DataTable";
import { SerialDetailsPanel } from "./SerialDetailsPanel";

const STATUS_STYLES = {
  available:  "text-green-700 bg-green-100",
  delivered:  "text-blue-700 bg-blue-100",
  blocked:    "text-orange-700 bg-orange-100",
  damaged:    "text-red-700 bg-red-100",
  reserved:   "text-yellow-700 bg-yellow-100",
  in_transit: "text-orange-700 bg-orange-100",
};

export default function SerialInventoryListing({ serialData, currentPage, totalPages, setCurrentPage }) {
  const [selectedSerialId, setSelectedSerialId] = useState(null);

  const columns = [
    {
      key: "serial_number",
      label: "Serial Number",
      render: (value) => (
        <span className="font-mono text-[11px] font-semibold text-gray-800">{value ?? "—"}</span>
      ),
    },
    {
      key: "node_name",
      label: "Node",
      render: (_, row) => row.node_inventory?.node?.name ?? "—",
    },
    {
      key: "sku_name",
      label: "SKU Name",
      render: (_, row) => row.node_inventory?.product_sku?.sku_name ?? "—",
    },
    {
      key: "sku_code",
      label: "SKU Code",
      render: (_, row) => (
        <span className="font-mono text-[11px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
          {row.node_inventory?.product_sku?.sku_code ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span className={`inline-flex px-2.5 py-1 uppercase rounded-full text-[10px] font-semibold ${STATUS_STYLES[value] ?? "text-gray-600 bg-gray-100"}`}>
          {value ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={serialData ?? []}
        rowKey="id"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onActionClick={(row) => setSelectedSerialId(row.id)}
      />

      {selectedSerialId && (
        <SerialDetailsPanel
          serialId={selectedSerialId}
          onClose={() => setSelectedSerialId(null)}
        />
      )}
    </>
  );
}