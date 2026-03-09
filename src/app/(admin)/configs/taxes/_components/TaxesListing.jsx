import DataTable from "../../../../../../components/shared/DataTable";

export default function TaxesListing({ taxesData, currentPage, totalPages, handlePageChange }) {
  const columns = [
    {
      key: "name",
      label: "Name"
    },
    {
      key: "code",
      label: "code"
    },
    {
      key: "cgst",
      label: "CGST",
      render: (value) => <span className="font-medium">{value} %</span>
    },
    {
      key: "sgst",
      label: "SGST",
      render: (value) => <span className="font-medium">{value} %</span>
    },
    {
      key: "igst",
      label: "IGST",
      render: (value) => <span className="font-medium">{value} %</span>
    },
    {
      key: "tax_percentage",
      label: "Tax Percentage",
      render: (value) => <span className="font-bold">{value} %</span>
    }
  ];


  return (
    <DataTable
      data={taxesData}
      columns={columns}
      rowKey="id"
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      getDetailsLink={(row) => `/configs/taxes/${row.id}`}
    />
  );
}