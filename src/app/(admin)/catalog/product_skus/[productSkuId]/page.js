"use client";

import { useParams } from "next/navigation";
import ProductSkuDetailsPage from "./_components/ProductSkuDetails";

export default function ProductSkuPage() {
  const params = useParams();
  const productSkuId = params.productSkuId;

  return(
    <div className="px-2 py-4">
      <ProductSkuDetailsPage productSkuId={productSkuId} />
    </div>
  );
}