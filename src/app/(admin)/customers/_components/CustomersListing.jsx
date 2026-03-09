import DataTable from "../../../../../components/shared/DataTable";

export default function CustomersListing({ customersData, currentPage, totalPages, setCurrentPage }) {
  const columns = [
    {
      key: "name",
      label: "Customer Name"
    },
    {
      key: "code",
      label: "Code"
    },
    {
      key: "email",
      label: "Email"
    },
    {
      key: "mobile_number",
      label: "Mobile number"
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (<span className={`inline-flex px-2.5 py-1 uppercase rounded-full text-[10px] font-semibold ${value === "active" ? "text-green-700 bg-green-100" : "text-gray-700 bg-gray-100"}`}>{value}</span>)
    }
  ];
  
  return(
    <div>
      <DataTable
        columns={columns}
        data={customersData}
        rowKey="id"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        getDetailsLink={(row) => `customers/${row.id}?`}
      />
    </div>
  );
}