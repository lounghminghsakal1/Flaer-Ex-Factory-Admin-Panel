"use client";
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import DataTable from '../../../../../../components/shared/DataTable';

export default function CategoryListing() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories`);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const result = await response.json();
            setData(result.data || []);
        } catch (err) {
            //   setData();
        } finally {
            setLoading(false);
        }
    };

    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const columns = [
        {
            key: 'name',
            label: 'Category Name',
            render: (value) => (
                <span className="font-semibold text-gray-900">{value}</span>
            ),
        },
        {
            key: 'code',
            label: 'Category Code',
            render: (value) => (
                <span className="font-mono text-gray-600">{value}</span>
            ),
        },
        {
            key: 'slug',
            label: 'Slug',
        },
        {
            key: 'description',
            label: 'Description',
            render: (value) => (
                <span className="max-w-xs truncate block">{value}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value) =>
                value === 'active' ? (
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                        ACTIVE
                    </span>
                ) : (
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                        INACTIVE
                    </span>
                ),
        },
        {
            key: 'parent',
            label: 'Parent',
            render: (value) =>
                value ? (
                    <span className="inline-flex px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-[11px] font-medium">
                        {value.name}
                    </span>
                ) : (
                    <span className="text-gray-400">—</span>
                ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 px-2 py-4">
            <div className="max-w-full mx-auto">
                {/* Table */}
                <DataTable
                    columns={columns}
                    getDetailsLink={(row) =>
                        `/catalog/categories/form?id=${row.id}`
                    }
                    data={data}
                />;
            </div>
        </div>
    );
}