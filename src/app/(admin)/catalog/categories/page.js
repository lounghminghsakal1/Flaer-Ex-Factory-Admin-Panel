"use client";

import { useSearchParams } from "next/navigation";
import CategoriesHeader from "./_components/CategoriesHeader";
import CategoryListing from "./_components/CategoriesListing";
import CategoriesTabs from "./_components/CategoriesTabs";

export default function CategoriesPage() {

    const searchParams = useSearchParams();
    const tab = searchParams.get("tab") || "parent";

    return (
        <section className="space-y-4">
            <CategoriesHeader />

            <CategoriesTabs activeTab={tab} />

            <CategoryListing tab={tab} />
        </section>
    );
}
