"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function VendorDetailsInfoTabSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full">

      {/* ───── Basic Info + Settings ───── */}
      <div className="grid grid-cols-[1fr_360px] gap-4 items-start">

        {/* Basic Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">

          {/* Title */}
          <Skeleton height={20} width={180} />

          {/* Fields */}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton height={12} width={100} />
                <Skeleton height={26} />
              </div>
            ))}
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">

          {/* Title */}
          <Skeleton height={20} width={120} />

          {/* Status buttons */}
          <Skeleton height={36} />

          {/* Vendor Type */}
          <div className="flex flex-col gap-2">
            <Skeleton height={12} width={100} />
            <Skeleton height={36} />
          </div>

          {/* Toggle */}
          <div className="flex flex-col gap-2">
            <Skeleton height={12} width={120} />
            <Skeleton height={20} width={50} />
          </div>

          {/* Tax Applied */}
          <div className="flex flex-col gap-2">
            <Skeleton height={12} width={120} />
            <Skeleton height={36} />
          </div>

        </div>

      </div>

      {/* ───── Billing Address Card ───── */}
      <div className="bg-white border w-[670px] border-gray-200 rounded-xl p-5 flex flex-col gap-4">

        <Skeleton height={20} width={160} />

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton height={12} width={100} />
              <Skeleton height={36} />
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}