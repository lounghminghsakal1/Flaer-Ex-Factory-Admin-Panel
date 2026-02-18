"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

import HeaderWithBackAction from "../../../../../../components/shared/HeaderWithBackAction";
import BrandsForm from "../_components/BrandsForm";
import BrandFormSkeleton from "../_components/BrandFormSkeleton";

export default function BrandDetailsPage() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const brandId = searchParams.get("id");
  const createNew = searchParams.get("createNew");

  const [isEditing, setIsEditing] = useState(createNew === "true");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    brand_name: "",
    brand_code: "",
    brand_description: "",
    brand_slug: "",
    priority: 1,
    status: "active",
    image_url: "",
    category_id: "",
    meta: {
      country: "",
      founded: "",
      specialization: ""
    }
  });

  useEffect(() => {
    if (brandId) fetchBrandData();
  }, [brandId]);

  const fetchBrandData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands/${brandId}`
      );

      const result = await res.json();
      const data = result.data;

      setFormData({
        brand_name: data.name ?? "",
        brand_code: data.code ?? "",
        brand_description: data.description ?? "",
        brand_slug: data.slug ?? "",
        priority: data.priority ?? 1,
        status: data.status ?? "active",
        image_url: data.image_url ?? "",
        category_id: data.category_id ?? "",
        meta: {
          country: data.meta?.country ?? "",
          founded: data.meta?.founded ?? "",
          specialization: data.meta?.specialization ?? "",
        }
      });

    } catch {
      toast.error("Failed to fetch brand");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {

    if (!formData.brand_name) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const url = brandId
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands/${brandId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/brands`;

      const method = brandId ? "PUT" : "POST";

      const payload = {
        name: formData.brand_name,
        code: formData.brand_code,
        description: formData.brand_description,
        priority: Number(formData.priority),
        status: formData.status,
        meta: formData.meta
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error();

      toast.success(brandId ? "Brand updated" : "Brand created", {
        
      });
      const returnTo = searchParams.get("returnTo");

      router.push(`/catalog/brands${returnTo ? `?${decodeURIComponent(returnTo)}` : ""}`);

    } catch {
      toast.error("Error saving brand");
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderAction = () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    handleSubmit();
  };

  if (loading && createNew !== "createNew") {
    return (
      <BrandFormSkeleton />
    );
  }

  return (
    <div className="px-2 py-4">

      <HeaderWithBackAction
        title={brandId ? "Brand Details" : "Create Brand"}
        isEditing={isEditing}
        loading={loading}
        onActionClick={handleHeaderAction}
        defaultBackPath="/catalog/brands"
      />

      <div className="w-150 mt-4">
        <BrandsForm
          formData={formData}
          setFormData={setFormData}
          isEditing={isEditing}
        />
      </div>

    </div>
  );
}
