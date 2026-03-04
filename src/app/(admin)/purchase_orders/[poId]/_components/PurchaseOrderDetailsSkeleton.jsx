"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export default function PurchaseOrderDetailsSkeleton() {
  return (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <div className="p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Skeleton width={180} height={28} />
          <Skeleton width={90} height={28} borderRadius={20} />
        </div>

        {/* TOP FORM ROW */}
        <div className="grid grid-cols-4 gap-6">
          <div>
            <Skeleton width={120} height={14} className="mb-2" />
            <Skeleton height={36} />
          </div>

          <div>
            <Skeleton width={160} height={14} className="mb-2" />
            <Skeleton height={36} />
          </div>

          <div>
            <Skeleton width={120} height={14} className="mb-2" />
            <Skeleton height={36} />
          </div>

          <div>
            <Skeleton width={70} height={14} className="mb-2" />
            <Skeleton width={100} height={20} />
          </div>
        </div>

        {/* PO LINE ITEMS TITLE */}
        <Skeleton width={180} height={24} />

        {/* TABLE HEADER */}
        <div className="grid grid-cols-5 gap-4">
          <Skeleton height={18} />
          <Skeleton height={18} />
          <Skeleton height={18} />
          <Skeleton height={18} />
          <Skeleton height={18} />
        </div>

        {/* TABLE ROW */}
        <div className="grid grid-cols-5 gap-4 items-center rounded-lg">
          <Skeleton height={36} />
          <Skeleton height={20} />
          <Skeleton height={20} />
          <Skeleton height={36} />
          <Skeleton circle width={24} height={24} />
        </div>

        {/* FOOTER SECTION */}
        <div className="flex justify-between mt-6">

          {/* APPROVED BUTTON */}
          <Skeleton width={140} height={44} borderRadius={8} />

          {/* AMOUNT SUMMARY */}
          <div className="space-y-3 w-72">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton width={120} height={16} />
                  <Skeleton width={80} height={16} />
                </div>
              ))}
          </div>

        </div>

      </div>
    </SkeletonTheme>
  );
}