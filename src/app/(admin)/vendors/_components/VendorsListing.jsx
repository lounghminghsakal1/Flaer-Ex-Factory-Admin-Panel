import DataTable from "../../../../../components/shared/DataTable";
import { useSearchParams } from "next/navigation";

export default function VendorsListing({ vendorsData, currentPage, totalPages, setCurrentPage }) {
  const searchParams = useSearchParams();
  const getReturnTo = () => encodeURIComponent(searchParams.toString());

  const vendorColumns = [
    {
      key: "firm_name",
      label: "Firm Name"
    },
    {
      key: "vendor_type",
      label: "Vendor Type",
      render: (value) => (
        <span className="capitalize">{value}</span>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-md text-[11px] font-semibold ${value === "active"
            ? "bg-green-100 text-green-700"
            : value === "inactive" ? "bg-gray-100 text-gray-700"
              : "bg-red-100 text-red-700"
            } capitalize`}
        >
          {value}
        </span>
      )
    },
    {
      key: "primary_contact_name",
      label: "Contact Name"
    },
    {
      key: "primary_contact_email",
      label: "Email"
    },
    {
      key: "primary_contact_phone",
      label: "Phone"
    }
  ];

  return (
    <DataTable
      columns={vendorColumns}
      data={vendorsData}
      rowKey="id"
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      getDetailsLink={(row) =>
        `/vendors/${row.id}?returnTo=${getReturnTo()}`
      }
    />
  );
}