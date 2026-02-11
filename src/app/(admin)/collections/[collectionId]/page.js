"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CollectionDetails from "./_components/CollectionDetails";

export default function CollectionDetailsPage() {

  const params = useParams();
  const collectionId = params.collectionId;

  const [collectionData, setCollectionData] = useState(null);

  useEffect(() => {
    if (!collectionId) return;
    fetchCollectionData();
  }, [collectionId]);

  const fetchCollectionData = async () => {
    try {
      console.log("Fetching collection", collectionId);
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/api/v1/collections/${collectionId}`;
      const response = await fetch(url);
      const result = await response.json();
      setCollectionData(result.data);
    } catch (err) {
      console.log(err);
    }
  };

  if (!collectionData) return <div>Loading...</div>;

  return (
    <CollectionDetails
      collection={collectionData}
      setCollectionData={setCollectionData}
      products={collectionData.collection_items}
    />
  );
}
