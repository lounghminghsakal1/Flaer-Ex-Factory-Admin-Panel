"use client";
import ButtonSplit from "../../../../../../components/ui/Button";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function BrandsHeader() {
  const router = useRouter();

  const handleCreateBrand = () => {
    router.push("/catalog/brands/form?createNew=true");
  }
  
  return(
    <div className="flex justify-between items-center px-2">
      <div>
        <h1 className="text-center text-xl font-bold text-blue-800">All Brands</h1>
      </div>
      <div>
        <ButtonSplit text={"Create Brand"} onClick={handleCreateBrand} icon={Plus} />
      </div>
    </div>
  );
}