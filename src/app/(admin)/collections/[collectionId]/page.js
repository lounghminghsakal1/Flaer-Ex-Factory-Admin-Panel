"use client";

import { useState, useEffect, cloneElement } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import CollectionForm from "../create/_components/CollectionForm";
import RightModalPanelCreate from "../create/_components/RightModalPanel";
import { useRouter } from "next/navigation";
import ProductsGrid from "../create/_components/ProductsGrid";
import { toast } from "react-toastify";
import HeaderWithBackAction from "../../../../../components/shared/HeaderWithBackAction";

export default function CollectionDetailsPage() {

  const params = useParams();
  const collectionId = params.collectionId;

  const [collection, setCollection] = useState(null);
  const [editedCollection, setEditedCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [productsList, setProductsList] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCollectionData();
  }, [collectionId]);

  useEffect(() => {
    if (collection) {
      setEditedCollection(collection);
    }
  }, [collection]);

  const fetchCollectionData = async () => {
    try {
      console.log("Fetching collection", collectionId);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}`;
      const response = await fetch(url);
      const result = await response.json();
      setCollection(result.data);
      setProductsList(result.data.collection.collection_items);
    } catch (err) {
      console.log(err);
    }
  };

  async function handleActionButton() {
    if (isEditing) {
      try {
        setIsLoading(true);

        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}`;

        const payload = {
          collection: {
            name: editedCollection.name,
            description: editedCollection.description,
            collection_type: editedCollection.collection_type,
            active: editedCollection.active
          }
        };

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("PUT failed");

        toast.success("Collection updated successfully");

        //setCollection(editedCollection); // update real data
        setIsEditing(false);

      } catch (err) {
        console.log(err);
        toast.error("Failed to save collection");
      } finally {
        setIsLoading(false);
      }
    } else {
      setEditedCollection(collection);
      setIsEditing(true);
    }
  }

  if (!collection) return <div className="text-center mx-auto h-screen py-60 text-blue-700 text-2xl font-bold ">Loading...</div>;

  const collectionName = JSON.parse(JSON.stringify(collection.name));

  return (
    <div className="flex flex-col h-screen px-2 py-4">
      <HeaderWithBackAction title={collectionName} loading={isLoading} isEditing={isEditing} onActionClick={handleActionButton}  />
      <div className="w-[50%] my-4">
        {(isEditing ? editedCollection : collection) && (
          <CollectionForm
            collection={isEditing ? editedCollection : collection}
            collectionId={collection.id}
            isEditing={isEditing}
            setCollection={setEditedCollection}
          />
        )}
      </div>
      <div className="w-full">
        <ProductsGrid products={collection.collection_items} setProducts={setProductsList} collectionId={collection.id} setCollectionData={setCollection} setIsRightModalOpen={setShowModal} />
      </div>
      {/* <div className="fixed top-1/2 right-2.5 flex justify-center items-center">
        <span className="p-3 rounded-full border-2 border-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer " onClick={() => setShowModal(true)} ><ArrowLeft /></span>
      </div> */}
      {showModal && (
        <RightModalPanelCreate onClose={() => setShowModal(false)} productsList={productsList} setProductsList={setProductsList} collectionId={collection.id} existingProducts={collection.collection_items} setCollectionData={setCollection} />
      )}
    </div>
  );
}
