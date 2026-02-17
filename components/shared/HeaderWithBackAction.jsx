"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Pencil, Save } from "lucide-react";

export default function HeaderWithBackAction({
  title = "",
  isEditing = false,
  loading = false,
  onActionClick,
  onBack,
  defaultBackPath = "/dashboard"
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnTo = searchParams.get("returnTo");

  const handleBack = () => {
    if (onBack) return onBack();
    if (returnTo) {
      router.push(`${defaultBackPath}?${decodeURIComponent(returnTo)}`);
      return;
    }
    router.push(defaultBackPath);
  };

  return (
    <div className="w-full border-b border-gray-200 ">
      <div className="flex items-center justify-between px-6 py-3">

        {/* LEFT */}
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

        {/* RIGHT ACTION BUTTON */}
        <button
          disabled={loading}
          onClick={onActionClick}
          className={`flex items-center gap-2 px-5 py-2 rounded-md font-medium shadow-sm transition 
          hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 cursor-pointer
          
          ${
            isEditing
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-primary text-white hover:bg-primary/90"
          }
          `}
        >
          {isEditing ? (
            <>
              <span>{loading ? "Saving..." : "Save"}</span>
              <Save size={16} />
            </>
          ) : (
            <>
              <span>Edit</span>
              <Pencil size={16} />
            </>
          )}
        </button>

      </div>
    </div>
  );
}
