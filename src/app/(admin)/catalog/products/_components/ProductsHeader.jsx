"use client";
import ButtonSplit from "../../../../../../components/ui/Button";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import CreateNewButton from "../../../../../../components/shared/CreateNewButton";

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
    <div className="flex justify-between items-center px-2 ">
      <div>
        <h1 className="text-center text-xl font-bold text-primary">Products</h1>
      </div>
      <CreateNewButton buttonTitle={"Create Product"} onClick={handleCreateProduct} />
    </div>
  );
}