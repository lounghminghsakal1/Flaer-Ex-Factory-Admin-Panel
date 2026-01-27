"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Save, Edit2, ArrowLeft, Plus, Package, Tag } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function CategoryForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isCreateNew = searchParams.get('createNew') === 'true';
    const categoryId = searchParams.get('id');

    const [isEditing, setIsEditing] = useState(isCreateNew);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!isCreateNew);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active',
        title: '',
        priority: 1,
        meta: {
            type: '',
            seo: ''
        }
    });

    useEffect(() => {
        if (!isCreateNew && categoryId) {
            fetchCategoryDetails();
        }
    }, [categoryId, isCreateNew]);

    const fetchCategoryDetails = async () => {
        try {
            setInitialLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories/${categoryId}`
            );
            if (!response.ok) throw new Error('Failed to fetch category');
            const result = await response.json();
            const data = result.data;

            setFormData({
                name: data.name ?? '',
                title: data.title ?? '',
                description: data.description ?? '',
                status: data.status ?? 'active',
                priority: data.priority ?? 1,
                meta: {
                    type: data.meta?.type ?? '',
                    seo: data.meta?.seo ?? '',
                },
            });

        } catch (err) {
            toast.error('Failed to load category details');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('meta.')) {
            const metaField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                meta: {
                    ...prev.meta,
                    [metaField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        try {
            setLoading(true);
            const url = isCreateNew
                ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories`
                : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories/${categoryId}`;

            const method = isCreateNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to save category');

            toast.success(
                isCreateNew ? 'Category created successfully!' : 'Category updated successfully!',
                {
                    duration: 2000,
                    icon: '✅',
                    style: {
                        background: '#10B981',
                        color: '#fff',
                        fontWeight: '600'
                    }
                }
            );

            setTimeout(() => {
                router.back();
            }, 1500);

        } catch (err) {
            toast.error(err.message || 'Something went wrong!', {
                duration: 3000,
                icon: '❌',
                style: {
                    background: '#EF4444',
                    color: '#fff',
                    fontWeight: '600'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditToggle = () => {
        if (isEditing && !isCreateNew) {
            handleSubmit();
        } else {
            setIsEditing(!isEditing);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <Toaster position="top-right" />

            <div className="max-w-7xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg bg-white hover:bg-gray-100 text-gray-700 transition-colors border cursor-pointer border-gray-200 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isCreateNew ? 'Create New Category' : 'Category Details'}
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {isCreateNew
                                    ? 'Fill in the details to create a new category'
                                    : isEditing
                                        ? 'Edit category information'
                                        : 'View category information'}
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={isCreateNew ? handleSubmit : handleEditToggle}
                        disabled={loading}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg ${isCreateNew
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : isEditing
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''} cursor-pointer`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {isCreateNew ? 'Creating...' : 'Saving...'}
                            </>
                        ) : isCreateNew ? (
                            <>
                                <Plus className="w-4 h-4" />
                                Save
                            </>
                        ) : isEditing ? (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        ) : (
                            <>
                                <Edit2 className="w-4 h-4" />
                                Edit
                            </>
                        )}
                    </button>
                </div>

                {/* Form Card */}
                <div className="max-w-4xl">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Basic Information Section */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Name & Title Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                            Category Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            required
                                            className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition-all ${isEditing
                                                ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                                                : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                                                } outline-none`}
                                            placeholder="Enter category name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                            Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            required
                                            className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition-all ${isEditing
                                                ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                                                : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                                                } outline-none`}
                                            placeholder="Enter title"
                                        />
                                    </div>
                                </div>

                                {/* Status & Priority Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                            Status <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-4">
                                            <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all cursor-pointer ${formData.status === 'active'
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="active"
                                                    checked={formData.status === 'active'}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                />
                                                <span className={`text-sm font-medium ${formData.status === 'active' ? 'text-green-700' : 'text-gray-700'
                                                    }`}>
                                                    Active
                                                </span>
                                            </label>

                                            <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all cursor-pointer ${formData.status === 'inactive'
                                                    ? 'border-gray-500 bg-gray-50'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="inactive"
                                                    checked={formData.status === 'inactive'}
                                                    onChange={handleInputChange}
                                                    disabled={!isEditing}
                                                    className="w-4 h-4 text-gray-600 focus:ring-gray-500"
                                                />
                                                <span className={`text-sm font-medium ${formData.status === 'inactive' ? 'text-gray-700' : 'text-gray-700'
                                                    }`}>
                                                    Inactive
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                            Priority <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            required
                                            min="1"
                                            className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition-all ${isEditing
                                                ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                                                : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                                                } outline-none`}
                                            placeholder="Enter priority"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        required
                                        rows="4"
                                        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition-all resize-none ${isEditing
                                            ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                                            : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                                            } outline-none`}
                                        placeholder="Enter category description"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Meta Information Section */}
                        <div className="p-6 bg-gray-50/50">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Tag className="w-5 h-5 text-purple-600" />
                                </div>
                                <h2 className="text-base font-semibold text-gray-900">Meta Information</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Type */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                        Type
                                    </label>
                                    <input
                                        type="text"
                                        name="meta.type"
                                        value={formData.meta.type}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition-all ${isEditing
                                            ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                                            : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                                            } outline-none`}
                                        placeholder="e.g., material"
                                    />
                                </div>

                                {/* SEO */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                                        SEO Slug
                                    </label>
                                    <input
                                        type="text"
                                        name="meta.seo"
                                        value={formData.meta.seo}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition-all ${isEditing
                                            ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white'
                                            : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                                            } outline-none`}
                                        placeholder="e.g., wood-products"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}