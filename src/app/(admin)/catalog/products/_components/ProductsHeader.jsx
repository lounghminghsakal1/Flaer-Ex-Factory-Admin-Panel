"use client";
import ButtonSplit from "../../../../../../components/ui/Button";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function ProductsHeader() {
  const router = useRouter();

  const handleCreateProduct = () => {
    const params = new URLSearchParams(window.location.search);

    router.push(
      `/catalog/products/form?createNew=true&returnTo=${encodeURIComponent(
        params.toString()
      )}`
    );
  };

  return (
    <div className="flex justify-between items-center px-2">
      <div>
        <h1 className="text-center text-xl font-bold text-blue-800">All Products</h1>
      </div>
      <div>
        <ButtonSplit text={"Create Product"} onClick={handleCreateProduct} icon={Plus} />
      </div>
    </div>
  );
}