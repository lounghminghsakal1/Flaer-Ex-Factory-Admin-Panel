"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function CategoriesTabs({ activeTab }) {

    const router = useRouter();
    const searchParams = useSearchParams();

    const changeTab = (tab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`/catalog/categories?${params.toString()}`);
    };

    return (
        <div className="flex gap-2 border-b border-gray-200">

            <button
                onClick={() => changeTab("parent")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === "parent"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
                Parent Categories
            </button>

            <button
                onClick={() => changeTab("sub")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === "sub"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
                Sub Categories
            </button>

        </div>
    );
}
