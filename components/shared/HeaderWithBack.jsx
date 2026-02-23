"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function HeaderWithBack({
  title = "",
  onBack,
  defaultBackPath = "/dashboard"
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnTo = searchParams.get("returnTo");

  const handleBack = () => {
    if (onBack) return onBack();

    if (returnTo) {
      const query = decodeURIComponent(returnTo);
      router.push(`${defaultBackPath}?${query}`);
      return;
    }

    router.push(defaultBackPath);
  };

  return (
    <div className="w-full border-b border-gray-200 ">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center justify-center h-10 w-10 rounded-full border border-primary text-primary 
            hover:scale-105 transition hover:bg-primary hover:text-white cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>

          <h1 className="text-lg font-semibold text-primary">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}