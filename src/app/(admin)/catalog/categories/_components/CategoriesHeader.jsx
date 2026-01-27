"use client";

import Button from "../../../../../../components/ui/Button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CategoriesHeader() {
    const router = useRouter();

    function handleCreateCategory() {
        router.push("/catalog/categories/form?createNew=true");
    }

    return(
        <div className="flex justify-between items-center px-2">  
            <div>
                <h1 className="text-center text-xl font-bold text-blue-800">All Categories</h1>
            </div> 
            <div>
                <Button text={"Create Category"} icon={Plus} onClick={handleCreateCategory}/>
                <button>
                    
                </button>
            </div>
        </div>
    );
}