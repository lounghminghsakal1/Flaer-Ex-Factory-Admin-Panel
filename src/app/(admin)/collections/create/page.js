"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import CollectionForm from "./_components/CollectionForm";
import RightModalPanel from "./_components/RightModalPanel";
import ProductsGrid from "./_components/ProductsGrid";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import HeaderWithBack from "../../../../../components/shared/HeaderWithBackAction";

export default function CreateCollectionPage() {

  const [isRightModalOpen, setIsRightModalOpen] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [createCollectionForm, setCreateCollectionForm] = useState({
    collection: {
      name: "",
      description: "",
      collection_type: "manual",
      active: true,
      items: productsList
    }
  });

  useEffect(() => {
    setCreateCollectionForm(prev => ({
      ...prev,
      collection: {
        ...prev.collection,
        items: productsList
      }
    }));
  }, [productsList]);


  const buildCreateCollectionPayload = () => {
    console.log("Inside build create collection payload");

    const collection = createCollectionForm.collection;

    if (!createCollectionForm?.collection?.name || !createCollectionForm?.collection?.collection_type) {
      toast.error("Please fill all required fields");
      return;
    }
    console.log("Inside build create collection payload2");

    if (!productsList || productsList.length === 0) {
      toast.error("Map atleast one product to the collection");
      return;
    }

    console.log("Inside build create collection payload3");

    const transformedItems = productsList.map((product, index) => ({
      product_id: product.id,
      sequence: index + 1,
      active: product.status === "active" || product.active === true
    }));

    console.log(transformedItems);

    return {
      collection: {
        name: collection.name,
        description: collection.description,
        collection_type: collection.collection_type || "manual",
        active: collection.active ?? true,
        items: transformedItems
      }
    };
  };

  const handleSave = async () => {
    try {
      console.log("SAVE CLICKED");

      setLoading(true);

      const payload = buildCreateCollectionPayload();

      if (!payload) {
        setLoading(false);
        return;
      }

      console.log("FINAL PAYLOAD", payload);

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections`;

      const json = await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json"
        }
      });

      let response = await json.json();
      let err;
      if (!response.ok) {
        err = response.errors[0];
        throw err;
      }

      toast.success("Collection saved successfully");
      router.back();

    } catch (err) {
      console.log(err);
      toast.error("Failed to save collection"+err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-2 py-4">
      <HeaderWithBack title="Create Collection" isEditing={true} loading={loading} onActionClick={handleSave} defaultBackPath="/collections" />
      <div className="w-[50%] my-4">
        <CollectionForm setCreateCollectionForm={setCreateCollectionForm} />
      </div>
      {isRightModalOpen && (
        <RightModalPanel onClose={() => setIsRightModalOpen(false)} productsList={productsList} setProductsList={setProductsList} />
      )}
      <ProductsGrid products={productsList} setProducts={setProductsList} setIsRightModalOpen={setIsRightModalOpen} />
    </div>
  );
}


