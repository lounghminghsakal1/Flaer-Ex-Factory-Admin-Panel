"use client";

import { useState, useEffect, cloneElement } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import CollectionForm from "../create/_components/CollectionForm";
import RightModalPanelCreate from "../create/_components/RightModalPanel";
import { useRouter } from "next/navigation";
import ProductsGrid from "../create/_components/ProductsGrid";
import { toast } from "react-toastify";

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
    <div className="flex flex-col h-screen p-4">
      <div className="flex justify-between items-center my-4">
        <div className="flex justify-center items-center gap-3">
          <div className="px-2 py-1.5 bg-gray-300 hover:bg-gray-200 rounded-md cursor-pointer" onClick={() => router.back()}><ArrowLeft /></div>
          <div className="flex flex-col ">
            <h1 className="text-2xl text-blue-800 font-semibold">{collectionName}</h1>
            <h2 className="text-md text-blue-800 font-medium">Collection Details</h2>
          </div>
        </div>
        <div>
          <button className="flex gap-1 items-center bg-blue-800 text-lg text-gray-100 px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200 ease-in-out" onClick={() => { handleActionButton() }}> <p> {isEditing ? isLoading ? 'Saving' : 'Save' : "Edit"}</p></button>
        </div>
      </div>
      <div className="w-[50%]">
        {(isEditing ? editedCollection : collection) && (
          <CollectionForm
            collection={isEditing ? editedCollection : collection}
            collectionId={collection.id}
            isEditing={isEditing}
            setCollection={setEditedCollection}
          />
        )}
      </div>
      <button className="w-[50%] my-4 p-4 flex justify-center items-center border border-dashed rounded-lg gap-2 text-blue-800 cursor-pointer hover:bg-blue-800 hover:text-gray-100 transition-colors duration-200 ease-in-out" onClick={() => { setShowModal(true); }}>
        <Plus size={25} />
        <h2>Add Products to Collection</h2>
      </button>
      <div className="w-[97%]">
        <ProductsGrid products={collection.collection_items} setProducts={setProductsList} collectionId={collection.id} setCollectionData={setCollection} />
      </div>
      <div className="fixed top-1/2 right-2.5 flex justify-center items-center">
        <span className="p-3 rounded-full border-2 border-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer " onClick={() => setShowModal(true)} ><ArrowLeft /></span>
      </div>
      {showModal && (
        <RightModalPanelCreate onClose={() => setShowModal(false)} productsList={productsList} setProductsList={setProductsList} collectionId={collection.id} existingProducts={collection.collection_items} setCollectionData={setCollection} />
      )}
    </div>
  );
}
