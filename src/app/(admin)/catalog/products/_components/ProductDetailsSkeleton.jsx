"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function ProductDetailsSkeleton() {
  return (
    <div className="px-4 py-4 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton circle width={40} height={40} />
          <div>
            <Skeleton width={180} height={22} />
            <Skeleton width={140} height={14} />
          </div>
        </div>
        <Skeleton width={100} height={40} borderRadius={8} />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-6">

        {/* LEFT MAIN INFO */}
        <div className="col-span-2 bg-white rounded-xl border p-6 space-y-4">

          <Skeleton width={220} height={20} />

          <div className="grid grid-cols-2 gap-4">
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>

          <Skeleton height={90} />

          <Skeleton height={40} />

          <div className="grid grid-cols-3 gap-4">
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>

          <Skeleton height={40} />

          <div className="flex gap-2">
            <Skeleton width={70} height={28} />
            <Skeleton width={80} height={28} />
            <Skeleton width={70} height={28} />
          </div>

        </div>

        {/* RIGHT SETTINGS */}
        <div className="bg-white rounded-xl border p-6 space-y-4">

          <Skeleton width={160} height={20} />

          <div className="flex gap-2">
            <Skeleton width={80} height={36} />
            <Skeleton width={80} height={36} />
            <Skeleton width={80} height={36} />
          </div>

          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />

          <div className="flex justify-between items-center">
            <Skeleton width={120} height={20} />
            <Skeleton width={40} height={24} />
          </div>

          <div className="flex justify-between items-center">
            <Skeleton width={140} height={20} />
            <Skeleton width={40} height={24} />
          </div>

        </div>

      </div>

      {/* PRODUCT PROPERTIES */}
      <div className="w-[60%] bg-white rounded-xl border p-6 space-y-4">
        <Skeleton width={180} height={20} />

        {[1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-2 gap-4">
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        ))}
      </div>

      {/* PRODUCT CONTENT */}
      <div className="w-[60%] bg-white rounded-xl border p-6 space-y-4">
        <Skeleton width={160} height={20} />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton height={40} />
          <Skeleton height={40} />
        </div>
      </div>

      {/* PRODUCT MEDIA */}
      <div className="w-[60%] bg-white rounded-xl border p-6 space-y-4">
        <Skeleton width={160} height={20} />
        <Skeleton height={180} />
      </div>

      {/* PRODUCT SKUs */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton width={180} height={20} />
          <Skeleton width={160} height={40} />
        </div>

        {/* TABLE HEADER */}
        <div className="grid grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={16} />
          ))}
        </div>

        {/* TABLE ROW */}
        <div className="grid grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={20} />
          ))}
        </div>

      </div>

    </div>
  );
}
