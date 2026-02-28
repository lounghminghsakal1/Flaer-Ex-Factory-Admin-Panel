"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

import CategoryForm from "../_components/CategoryForm";
import HeaderWithBackAction from "../../../../../../components/shared/HeaderWithBackAction";
import CategoryDetailsSkeleton from "../_components/CategoryDetailsSkeleton";

export default function CategoryFormPage() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const isCreateNew = searchParams.get("createNew") === "true";
  const categoryId = searchParams.get("id");

  const [isEditing, setIsEditing] = useState(isCreateNew);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isCreateNew);

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    status: "active",
    description: "",
    parent_id: null
  });

  const [isParentToggle, setIsParentToggle] = useState(true);

  useEffect(() => {
    if (!isCreateNew && categoryId) fetchCategoryDetails();
  }, [categoryId]);

  const fetchCategoryDetails = async () => {
    try {
      setInitialLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories/${categoryId}`
      );

      const result = await res.json();
      if (!res.ok || result?.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");
      const data = result.data;

      setFormData({
        name: data.name ?? "",
        title: data.title ?? "",
        description: data.description ?? "",
        status: data.status ?? "active",
        parent_id: data.parent?.id ?? null
      });

    } catch (err) {
      console.log(err);
      toast.error("Failed to load category " + err.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async () => {

    if (!formData.name.trim() || !formData.title.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!isParentToggle && formData.parent_id === null) {
      toast.error("Please select a parent category");
      return;
    }

    setLoading(true);

    try {
      const url = isCreateNew
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/categories/${categoryId}`;

      const method = isCreateNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (!res.ok || result.status === "failure") throw new Error(result?.errors[0] ?? "Something went wrong");

      toast.success(isCreateNew ? "Category created" : "Category updated");
      const returnTo = searchParams.get("returnTo");

      router.push(
        `/catalog/categories${returnTo ? `?${decodeURIComponent(returnTo)}` : ""
        }`
      );

    } catch(err) {
      console.log(err);
      toast.error("Failed to save category "+ err.message);
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

  if (initialLoading && !isCreateNew) return <CategoryDetailsSkeleton />;

  return (
    <div className="px-2 py-4">

      <HeaderWithBackAction
        title={isCreateNew ? "Create Category" : "Category Details"}
        isEditing={isEditing}
        loading={loading}
        onActionClick={handleHeaderAction}
        defaultBackPath="/catalog/categories"
      />

      <div className="w-full mt-4">
        <CategoryForm
          formData={formData}
          setFormData={setFormData}
          isEditing={isEditing}
          isCreateNew={isCreateNew}
          isParentToggle={isParentToggle}
          setIsParentToggle={setIsParentToggle}
        />
      </div>

    </div>
  );
}
