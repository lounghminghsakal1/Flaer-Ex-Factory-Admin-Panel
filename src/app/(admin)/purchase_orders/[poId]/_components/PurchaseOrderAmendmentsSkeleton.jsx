"use client";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export default function PurchaseOrderAmendmentsSkeleton() {
  return (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <div className="p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <Skeleton width={260} height={26} className="mb-2" />
            <Skeleton width={180} height={18} />
          </div>

          <Skeleton width={190} height={40} borderRadius={8} />
        </div>

        {/* AMENDMENT LIST */}
        <div className="space-y-4">

          {Array(5)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl p-4 shadow-sm"
              >
                {/* LEFT SECTION */}
                <div className="flex items-center gap-4">

                  {/* NUMBER CIRCLE */}
                  <Skeleton circle width={40} height={40} />

                  <div>
                    <Skeleton width={180} height={18} className="mb-2" />
                    <Skeleton width={100} height={14} />
                  </div>

                  {/* STATUS BADGE */}
                  <Skeleton
                    width={90}
                    height={26}
                    borderRadius={20}
                    className="ml-4"
                  />
                </div>

                {/* DROPDOWN ICON */}
                <Skeleton circle width={24} height={24} />
              </div>
            ))}

        </div>
      </div>
    </SkeletonTheme>
  );
}