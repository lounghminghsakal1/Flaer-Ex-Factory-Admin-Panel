"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import CollectionForm from "./_components/CollectionForm";
import RightModalPanelCreate from "./_components/RightModalPanelCreate";
import ProductsGrid from "./_components/ProductsGrid";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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

      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed");

      toast.success("Collection saved successfully");
      router.back();

    } catch (err) {
      console.log(err);
      toast.error("Failed to save collection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <div className="flex justify-center items-center gap-3">
          <div className="px-2 py-1.5 bg-gray-300 hover:bg-gray-200 rounded-md cursor-pointer" onClick={() => router.back()}><ArrowLeft /></div>
          <h1 className="text-2xl text-blue-800 font-semibold">Create Collection</h1>
        </div>
        <div>
          <button className="flex gap-1 items-center bg-blue-800 text-lg text-gray-100 px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200 ease-in-out" onClick={() => { handleSave() }}> <p> {loading ? 'Saving' : 'Save'}</p></button>
        </div>
      </div>

      <div className="w-[50%] my-4">
        <CollectionForm setCreateCollectionForm={setCreateCollectionForm} />
      </div>

      <button className="w-[50%]  my-4 p-4 flex justify-center items-center border border-dashed gap-2 text-blue-800 cursor-pointer hover:bg-blue-800 hover:text-gray-100 transition-colors duration-200 ease-in-out" onClick={() => setIsRightModalOpen(true)}>
        <Plus size={25} />
        <h2>Add Products to Collection</h2>
      </button>

      {isRightModalOpen && (
        <RightModalPanelCreate onClose={() => setIsRightModalOpen(false)} productsList={productsList} setProductsList={setProductsList} />
      )}

      <ProductsGrid products={productsList} setProducts={setProductsList} />

    </div>
  );
}


