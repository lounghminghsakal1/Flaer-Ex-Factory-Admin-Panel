'use client';

import { useEffect, useState } from 'react';
import DataTable from '../../../../../../components/shared/DataTable';

export default function BrandsListing() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands`)
      .then(res => res.json())
      .then(res => {
        setBrands(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const columns = [
    {
      key: 'name',
      label: 'Brand Name',
      render: (value) => (
        <span className="font-medium text-gray-900">
          {value}
        </span>
      ),
    },
    {
      key: 'code',
      label: 'Brand Code',
    },
    {
      key: 'priority',
      label: 'Priority',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold
            ${value === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }`}
        >
          {value?.toUpperCase()}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading brands...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Brands Table */}
      <DataTable
        columns={columns}
        data={brands}
        rowKey="id"
        getDetailsLink={(row) => `/catalog/brands/form?id=${row.id}`}
      />
    </div>
  );
}
