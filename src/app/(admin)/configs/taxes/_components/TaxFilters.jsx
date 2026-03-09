"use client";

import { FilterX, SearchIcon, Check } from "lucide-react";
import { useEffect, useState } from "react";
import CreateNewButton from "../../../../../../components/shared/CreateNewButton";
import { useRouter } from "next/navigation";

export default function TaxFilters({ startss_with, onApply, onClear }) {

  const router = useRouter();

  const [starts_with, setStarts_with] = useState(startss_with ?? "");

  useEffect(() => {
    setStarts_with(startss_with);
  }, [startss_with]);

  useEffect(() => {
    if (starts_with !== "") return;
    onApply({ starts_with });
  }, [starts_with]);

  return (
    <div className="w-full mx-auto my-4">
      <div className="flex justify-between flex-wrap items-end gap-3 mb-3">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* SEARCH */}
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search by tax name..."
              className="border border-gray-300 text-gray-700 text-sm px-2 py-3 h-8 w-48 rounded-l placeholder-gray-400 focus:outline-none focus:border-gray-500 transition"
              value={starts_with ?? ""}
              onChange={(e) => setStarts_with(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onApply({ starts_with });
              }}
            />
            <span
              className="h-8 px-2 py-3 bg-primary flex items-center border border-gray-300 border-l-0 rounded-r cursor-pointer hover:scale-105 transition"
              onClick={() => { onApply({ starts_with }) }}
            >
              <SearchIcon size={16} color="white" />
            </span>
          </div>

          {/* APPLY */}
          {(starts_with) && (
            <button
              onClick={() => onApply({ starts_with })}
              className="flex items-center text-sm gap-1 h-8 px-3 border border-primary text-primary rounded hover:scale-105 transition cursor-pointer"
            >
              <Check size={16} />
              Apply
            </button>
          )}

          {/* CLEAR */}
          {(starts_with) && (
            <button
              onClick={() => { onClear(); setStarts_with("") }}
              className="flex text-sm items-center gap-1 h-8 px-3 border border-gray-700 text-gray-700 rounded hover:scale-105 transition cursor-pointer"
            >
              <FilterX size={16} />
              Clear Filters
            </button>
          )}
        </div>

        <CreateNewButton
          buttonTitle="Create Tax"
          onClick={() => {
            const params = new URLSearchParams(window.location.search);

            router.push(
              `/configs/taxes/new?returnTo=${encodeURIComponent(
                params.toString()
              )}`
            );
          }}
        />

      </div>
    </div>
  );
}